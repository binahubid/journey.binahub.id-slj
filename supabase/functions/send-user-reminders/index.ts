// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { prayerTimesUrl } from "../_shared/prayer-location.ts";

const jsonHeaders = { "Content-Type": "application/json" };

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  const expectedSecret = Deno.env.get("REMINDER_CRON_SECRET");
  if (!expectedSecret || req.headers.get("x-cron-secret") !== expectedSecret) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@binahub.id";
    if (!vapidPublicKey || !vapidPrivateKey) throw new Error("VAPID keys are not configured");

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: generated, error: generateError } = await supabase.rpc("generate_due_user_reminders");
    if (generateError) throw generateError;

    // Prayer reminders are generated here because prayer times come from Aladhan, not the database.
    const { data: prayerUsers, error: prayerUsersError } = await supabase
      .from("settings")
      .select("user_id, preferred_prayer_city, prayer_reminder_minutes, profiles!inner(timezone, role, program_code)")
      .eq("prayer_notifications_enabled", true);
    if (prayerUsersError) throw prayerUsersError;

    const activeTrials = new Set<string>();
    if (prayerUsers?.some(setting => setting.profiles?.program_code === "SLJ-TRIAL-14")) {
      const { data: trials, error: trialError } = await supabase.from("slj_trial_enrollments")
        .select("user_id").gt("expires_at", new Date().toISOString());
      if (trialError) throw trialError;
      for (const trial of trials || []) activeTrials.add(trial.user_id);
    }

    const prayerCache = new Map();
    let prayerCreated = 0;
    for (const setting of prayerUsers || []) {
      if (setting.profiles?.role !== "participant") continue;
      if (!setting.profiles?.program_code) continue;
      if (setting.profiles.program_code === "SLJ-TRIAL-14" && !activeTrials.has(setting.user_id)) continue;
      const timezone = setting.profiles?.timezone || "Asia/Jakarta";
      const city = setting.preferred_prayer_city || "Jakarta";
      const localParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const part = (type) => localParts.find((item) => item.type === type)?.value;
      const localDate = `${part("year")}-${part("month")}-${part("day")}`;
      const currentMinutes = Number(part("hour")) * 60 + Number(part("minute"));
      const cacheKey = `${city}:${localDate}:${timezone}`;

      let timings = prayerCache.get(cacheKey);
      if (!timings) {
        try {
          const response = await fetch(prayerTimesUrl(city, localDate, timezone), {
            signal: AbortSignal.timeout(8_000),
          });
          if (!response.ok) continue;
          const result = await response.json();
          timings = result?.data?.timings;
          if (!timings) continue;
          prayerCache.set(cacheKey, timings);
        } catch {
          continue;
        }
      }

      const reminderMinutes = Number(setting.prayer_reminder_minutes || 10);
      const prayers = [
        ["Subuh", timings.Fajr],
        ["Dzuhur", timings.Dhuhr],
        ["Ashar", timings.Asr],
        ["Maghrib", timings.Maghrib],
        ["Isya", timings.Isha],
      ];

      for (const [name, rawTime] of prayers) {
        const time = String(rawTime || "").replace(/\s*\(.*\)/, "");
        const [hour, minute] = time.split(":").map(Number);
        const targetMinutes = hour * 60 + minute;
        if (!Number.isFinite(targetMinutes) || currentMinutes < targetMinutes - reminderMinutes || currentMinutes > targetMinutes) continue;

        const { error: insertError } = await supabase.from("notifications").insert({
          user_id: setting.user_id,
          title: `${reminderMinutes} menit menuju ${name}`,
          message: `Persiapkan diri dan wudhu untuk menunaikan sholat ${name}.`,
          category: "reminder",
          dedupe_key: `prayer:${localDate}:${name.toLowerCase()}`,
          action_url: setting.profiles.program_code === "SLJ-TRIAL-14" ? "/trial" : "/dashboard",
        });
        if (!insertError) prayerCreated++;
        else if (insertError.code !== "23505") throw insertError;
      }
    }

    const { data: rows, error: claimError } = await supabase.rpc("claim_pending_push_notifications", { p_limit: 500 });
    if (claimError) throw claimError;

    // Hitung unread count per user agar badge di app icon akurat (bukan selalu 1).
    const userIds = [...new Set((rows || []).map((r) => r.user_id))];
    const unreadByUser = new Map<string, number>();
    if (userIds.length > 0) {
      const { data: unreadRows } = await supabase
        .from("notifications")
        .select("user_id")
        .in("user_id", userIds)
        .eq("is_read", false);
      for (const u of unreadRows || []) {
        unreadByUser.set(u.user_id, (unreadByUser.get(u.user_id) || 0) + 1);
      }
    }

    const successfulNotificationIds = new Set<string>();
    let sent = 0;
    let failed = 0;
    const failedEndpoints: { endpoint: string; statusCode: number }[] = [];

    // Kirim paralel dengan concurrency terbatas agar tidak menumpuk antrian.
    const CONCURRENCY = 20;
    const rowsCopy = [...(rows || [])];
    let cursor = 0;

    const worker = async () => {
      while (cursor < rowsCopy.length) {
        const row = rowsCopy[cursor++];
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            JSON.stringify({
              title: row.title,
              body: row.message,
              url: row.action_url || "/notifications",
              tag: `notification-${row.notification_id}`,
              badgeCount: unreadByUser.get(row.user_id) || 0,
            })
          );
          successfulNotificationIds.add(row.notification_id);
          sent++;
        } catch (error) {
          failed++;
          failedEndpoints.push({ endpoint: row.endpoint, statusCode: error?.statusCode });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, Math.max(1, rowsCopy.length)) }, () => worker()));

    for (const f of failedEndpoints) {
      await supabase.from("push_subscriptions").update({
        is_active: f.statusCode === 404 || f.statusCode === 410 ? false : true,
        last_error: `Push failed with status ${f.statusCode}`,
        updated_at: new Date().toISOString(),
      }).eq("endpoint", f.endpoint);
    }

    if (successfulNotificationIds.size > 0) {
      const { error: markError } = await supabase.rpc("mark_push_notifications_sent", {
        p_notification_ids: [...successfulNotificationIds],
      });
      if (markError) throw markError;
    }

    return new Response(JSON.stringify({ success: true, generated, prayerCreated, sent, failed }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: jsonHeaders });
  }
});
