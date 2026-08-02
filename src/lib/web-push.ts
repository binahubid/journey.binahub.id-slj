import type { SupabaseClient } from "@supabase/supabase-js";

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0))).buffer as ArrayBuffer;
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushPermission(): Promise<NotificationPermission | "unsupported"> {
  return isPushSupported() ? Notification.permission : "unsupported";
}

export async function enableWebPush(supabase: SupabaseClient): Promise<void> {
  if (!isPushSupported()) throw new Error("Browser ini belum mendukung notifikasi HP.");

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) throw new Error("VAPID public key belum dikonfigurasi.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Izin notifikasi ditolak. Aktifkan kembali melalui pengaturan browser."
      : "Izin notifikasi belum diberikan.");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi pengguna tidak ditemukan.");

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("Subscription notifikasi tidak lengkap.");
  }

  const { error: subscriptionError } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
    is_active: true,
    last_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (subscriptionError) throw subscriptionError;

  const { error: settingsError } = await supabase.from("settings").upsert({
    user_id: user.id,
    push_notifications_enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (settingsError) throw settingsError;
}

export async function disableWebPush(supabase: SupabaseClient): Promise<void> {
  if (!isPushSupported()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await supabase.from("push_subscriptions").update({
      is_active: false,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id).eq("endpoint", subscription.endpoint);
    await subscription.unsubscribe();
  }

  const { error } = await supabase.from("settings").upsert({
    user_id: user.id,
    push_notifications_enabled: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}
