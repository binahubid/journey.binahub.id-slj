"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PrayerTimesWidget } from "@/components/domain/PrayerTimesWidget";
import { PrayerTracker } from "@/components/domain/PrayerTracker";
import { QuranTracker } from "@/components/domain/QuranTracker";
import { DailyHadithWidget } from "@/components/domain/DailyHadithWidget";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import {
  Compass,
  BookOpen,
  Check,
  ArrowRight,
  Award,
  Clock,
  Pin,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronRight,
  BookMarked,
  CheckCircle2,
  Sunset,
  Search,
  ArrowUpRight,
  Heart,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState("Peserta");
  const [userLocation, setUserLocation] = useState("Jakarta");
  const [dayCount, setDayCount] = useState(1);
  const [journeyStatus, setJourneyStatus] = useState<string>("ONBOARDING");
  const [progressPercent, setProgressPercent] = useState(0);

  // Journal state
  const [journalContent, setJournalContent] = useState("");
  const [journalLast, setJournalLast] = useState("");
  const [journalLastDate, setJournalLastDate] = useState("");
  const [writeJournalOpen, setWriteJournalOpen] = useState(false);
  const [allJournalsModalOpen, setAllJournalsModalOpen] = useState(false);
  const [userJournals, setUserJournals] = useState<
    { id: string; date: string; reflection: string; isPinned?: boolean }[]
  >([]);
  const [journalSearch, setJournalSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // Habits
  const [habits, setHabits] = useState<
    { id: string; title: string; completedToday: boolean; completedCount: number; quantity: number; category: string; areaCategory: string }[]
  >([]);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [habitPercentage, setHabitPercentage] = useState(0);
  const [prayerLogsMap, setPrayerLogsMap] = useState<Record<string, boolean>>({});
  const [habitSaveError, setHabitSaveError] = useState<string | null>(null);

  // Modals
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [todayTasksModalOpen, setTodayTasksModalOpen] = useState(false);
  const [consistencyModalOpen, setConsistencyModalOpen] = useState(false);
  const [allPrayerModalOpen, setAllPrayerModalOpen] = useState(false);

  // Dedicated Analytics Modals for Sholat, Tilawah, Hadits
  const [sholatAnalyticsOpen, setSholatAnalyticsOpen] = useState(false);
  const [quranAnalyticsOpen, setQuranAnalyticsOpen] = useState(false);
  const [hadithAnalyticsOpen, setHadithAnalyticsOpen] = useState(false);

  // Real stats
  const [accountCreatedDate, setAccountCreatedDate] = useState<string>("");
  const [streakDays, setStreakDays] = useState(1);
  const [completedTotalLogsCount, setCompletedTotalLogsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [safarRemindedToday, setSafarRemindedToday] = useState(false);
  const [isScreenSaver, setIsScreenSaver] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsScreenSaver(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live Clock & Next Prayer
  const [heroClockMain, setHeroClockMain] = useState<string>("--:--");
  const [heroClockSeconds, setHeroClockSeconds] = useState<string>("00");
  const [heroDate, setHeroDate] = useState<string>("");
  const [timeZoneStr, setTimeZoneStr] = useState<string>("WIB");
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{
    name: string;
    time: string;
    text: string;
    isGracePeriod?: boolean;
    graceMessage?: string;
  }>({
    name: "Subuh",
    time: "04:43",
    text: "Menghitung...",
    isGracePeriod: false,
    graceMessage: "",
  });
  const [nextPrayerProgress, setNextPrayerProgress] = useState(0);
  const [prayerTimingsData, setPrayerTimingsData] = useState<
    { name: string; time: string; secs: number }[] | null
  >(null);

  // Adaptive WebP background image for Hero
  const [adaptiveHeroBgImage, setAdaptiveHeroBgImage] = useState<string>("/malam.webp");

  // Map prayer name to custom WebP icon
  const prayerIconMap: Record<string, string> = {
    Subuh: "/icon_subuh.webp",
    Dzuhur: "/icon_dzuhur.webp",
    Ashar: "/icon_ashar.webp",
    Maghrib: "/icon_maghrib.webp",
    Isya: "/icon_isya.webp",
  };

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hour = d.getHours();

      // Format clock: main = HH:mm, seconds separate
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setHeroClockMain(`${hh}:${mm}`);
      setHeroClockSeconds(ss);

      setHeroDate(
        d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );

      // Detect Timezone string without emoji
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz.includes("Jakarta")) setTimeZoneStr("WIB");
        else if (tz.includes("Makassar")) setTimeZoneStr("WITA");
        else if (tz.includes("Jayapura")) setTimeZoneStr("WIT");
        else setTimeZoneStr(tz);
      } catch {
        setTimeZoneStr("WIB");
      }

      // Adaptive BG Image based on total minutes
      const totalMins = hour * 60 + d.getMinutes();
      if (totalMins >= 240 && totalMins < 360) {
        setAdaptiveHeroBgImage("/fajar.webp"); // 04:00 - 06:00
      } else if (totalMins >= 360 && totalMins < 660) {
        setAdaptiveHeroBgImage("/pagi.webp"); // 06:00 - 11:00
      } else if (totalMins >= 660 && totalMins < 900) {
        setAdaptiveHeroBgImage("/siang.webp"); // 11:00 - 15:00
      } else if (totalMins >= 900 && totalMins < 1080) {
        setAdaptiveHeroBgImage("/sore.webp"); // 15:00 - 18:00
      } else if (totalMins >= 1080 && totalMins < 1170) {
        setAdaptiveHeroBgImage("/petang.webp"); // 18:00 - 19:30
      } else {
        setAdaptiveHeroBgImage("/malam.webp"); // 19:30 - 04:00
      }

      // Live Prayer Times & Circular Progress Calculation (with 3-minute grace period)
      if (prayerTimingsData && prayerTimingsData.length > 0) {
        const currSecs = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        const list = prayerTimingsData;

        let found = false;

        // Check if currently within 3-minute grace period (180s) after any prayer time
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          if (currSecs >= p.secs && currSecs < p.secs + 180) {
            setNextPrayerInfo({
              name: p.name,
              time: p.time,
              text: "Sholat",
              isGracePeriod: true,
              graceMessage: `Selamat menunaikan ibadah sholat ${p.name}`,
            });
            setNextPrayerProgress(100);
            found = true;
            break;
          }
        }

        // If not in 3-minute grace period, find next upcoming prayer
        if (!found) {
          for (let i = 0; i < list.length; i++) {
            const p = list[i];
            if (p.secs > currSecs) {
              const leftSecs = p.secs - currSecs;
              const hrs = Math.floor(leftSecs / 3600);
              const m = Math.floor((leftSecs % 3600) / 60);
              const text = hrs > 0 ? `${hrs}j ${m}m` : `${m}m`;

              // Prev prayer: if i == 0, prev prayer was Isya of previous day
              const prevSecs = i > 0 ? list[i - 1].secs : list[4].secs - 24 * 3600;
              const totalGap = p.secs - prevSecs;
              const remainingPct =
                totalGap > 0
                  ? Math.min(100, Math.max(0, Math.round((leftSecs / totalGap) * 100)))
                  : 0;

              setNextPrayerInfo({
                name: p.name,
                time: p.time,
                text,
                isGracePeriod: false,
                graceMessage: "",
              });
              setNextPrayerProgress(remainingPct);
              found = true;
              break;
            }
          }
        }

        if (!found) {
          const fajrSecs = list[0].secs;
          const leftSecs = 24 * 3600 - currSecs + fajrSecs;
          const hrs = Math.floor(leftSecs / 3600);
          const m = Math.floor((leftSecs % 3600) / 60);

          const isyaSecs = list[4].secs;
          const totalGap = 24 * 3600 - isyaSecs + fajrSecs;
          const remainingPct =
            totalGap > 0
              ? Math.min(100, Math.max(0, Math.round((leftSecs / totalGap) * 100)))
              : 0;

          setNextPrayerInfo({
            name: "Subuh",
            time: list[0].time,
            text: `${hrs}j ${m}m`,
            isGracePeriod: false,
            graceMessage: "",
          });
          setNextPrayerProgress(remainingPct);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [prayerTimingsData]);

  // Fetch Prayer Times for Main Header Next Prayer
  useEffect(() => {
    async function fetchHeroPrayerTimes() {
      try {
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
            userLocation || "Jakarta"
          )}&country=Indonesia&method=11`
        );
        const data = await res.json();
        if (data?.data?.timings) {
          const t = data.data.timings;
          const parseSecs = (str: string) => {
            const [h, m] = str
              .replace(/\s*\(.*\)/, "")
              .split(":")
              .map(Number);
            return h * 3600 + m * 60;
          };

          const list = [
            { name: "Subuh", time: t.Fajr.replace(/\s*\(.*\)/, ""), secs: parseSecs(t.Fajr) },
            { name: "Dzuhur", time: t.Dhuhr.replace(/\s*\(.*\)/, ""), secs: parseSecs(t.Dhuhr) },
            { name: "Ashar", time: t.Asr.replace(/\s*\(.*\)/, ""), secs: parseSecs(t.Asr) },
            { name: "Maghrib", time: t.Maghrib.replace(/\s*\(.*\)/, ""), secs: parseSecs(t.Maghrib) },
            { name: "Isya", time: t.Isha.replace(/\s*\(.*\)/, ""), secs: parseSecs(t.Isha) },
          ];
          setPrayerTimingsData(list);
        }
      } catch (e) {
        console.error("Gagal load hero prayer times:", e);
      }
    }
    fetchHeroPrayerTimes();
  }, [userLocation]);

  // Load Dashboard Data
  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Load pinned journals from localStorage
        try {
          const savedPins = localStorage.getItem(`slj_pinned_${user.id}`);
          if (savedPins) setPinnedIds(JSON.parse(savedPins));
        } catch {
          // ignore
        }

        // 1. Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          setUserName(
            profile.full_name || user.email?.split("@")[0] || "Peserta"
          );
          if (profile.location) setUserLocation(profile.location);
          const cDate = profile.created_at ? new Date(profile.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
          setAccountCreatedDate(cDate);
        } else {
          setAccountCreatedDate(new Date().toISOString().split("T")[0]);
        }

        // Check if reminded safar today
        const safarTodayStr = new Date().toISOString().split("T")[0];
        try {
          const { data: safarData } = await supabase
            .from("safar_reminders")
            .select("id")
            .eq("user_id", user.id)
            .eq("date", safarTodayStr)
            .maybeSingle();
          if (safarData) setSafarRemindedToday(true);
        } catch {}

        // 2. Journey
        const { data: journey, error: journeyError } = await supabase
          .from("journeys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (journeyError) throw journeyError;

        if (journey || profile?.start_date) {
          setJourneyStatus(journey?.status || "ACTIVE");
          const startDateVal = profile?.start_date || journey?.start_date || journey?.created_at;
          if (startDateVal) {
            const start = new Date(startDateVal);
            const today = new Date();
            start.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const diffTime = today.getTime() - start.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const currentDay = Math.min(90, Math.max(1, diffDays));
            setDayCount(currentDay);
            setProgressPercent(Math.min(100, Math.round((currentDay / 90) * 100)));
          }
        }

        // 3. Habits: Query habits table + action_plans, ensuring valid habits.id FK
        const todayStr = new Date().toISOString().split("T")[0];
        let userHabits: any[] = [];

        // Query action_plans from PTP
        let { data: actionPlansData, error: actionPlansError } = await supabase
          .from("action_plans")
          .select("*")
          .eq("journey_id", journey?.id || "");
        if (actionPlansError) throw actionPlansError;

        // Older PTP data may still point to a previous journey row.
        if ((!actionPlansData || actionPlansData.length === 0) && journey?.id) {
          const fallback = await supabase.from("action_plans").select("*").eq("user_id", user.id);
          if (fallback.error) throw fallback.error;
          actionPlansData = fallback.data;
        }

        // Query habits table (the FK target for habit_logs) - ONLY valid columns!
        const { data: habitsTableData, error: habitsTableError } = await supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id);
        if (habitsTableError) throw habitsTableError;

        const existingHabits = habitsTableData || [];
        const habitMap: Record<string, any> = {};

        if (actionPlansData && actionPlansData.length > 0) {
          for (const ap of actionPlansData) {
            let match = existingHabits.find(
              (h: any) => h.action_plan_id === ap.id || (h.title && h.title.trim().toLowerCase() === ap.title.trim().toLowerCase())
            );

            if (match && (!match.action_plan_id || !match.area_category)) {
              const { data: linked, error: linkError } = await supabase.from("habits").update({
                action_plan_id: ap.id,
                area_category: ap.area_category || ap.category || "Spiritual Growth",
                quantity: ap.quantity || ap.target || match.quantity || match.target || 1,
              }).eq("id", match.id).select("*").maybeSingle();
              if (!linkError && linked) match = linked;
            }

            if (!match) {
              // Try to create missing habits row (only valid schema columns!)
              try {
                const { data: created, error: createHabitError } = await supabase
                  .from("habits")
                  .insert({
                    user_id: user.id,
                    action_plan_id: ap.id,
                    title: ap.title,
                    category: ap.area_category || ap.category || "Spiritual Growth",
                    frequency: ap.frequency || "Harian",
                    target: ap.quantity || ap.target || 1,
                    quantity: ap.quantity || ap.target || 1,
                    area_category: ap.area_category || ap.category || "Spiritual Growth",
                  })
                  .select("*")
                  .maybeSingle();

                if (createHabitError) throw createHabitError;
                if (created) match = created;
              } catch (e) {
                console.warn("Could not insert habit row:", e);
              }
            }

            if (!match) continue;
            habitMap[ap.id] = {
              id: match.id,
              action_plan_id: ap.id,
              title: ap.title,
              quantity: ap.quantity || ap.target || (match ? (match.quantity || match.target) : 1) || 1,
              area_category: ap.area_category || ap.category || (match ? (match.area_category || match.category) : null) || "Spiritual Growth",
              effective_from: match?.effective_from || null,
              effective_until: match?.effective_until || null,
            };
          }
        }

        // Include any standalone habits from habits table
        existingHabits.forEach((h: any) => {
          if (!Object.values(habitMap).some((m: any) => m.id === h.id) && h.is_archived !== true) {
            habitMap[h.id] = {
              id: h.id,
              action_plan_id: h.action_plan_id || null,
              title: h.title,
              quantity: h.quantity || h.target || 1,
              area_category: h.area_category || h.category || "Spiritual Growth",
              effective_from: h.effective_from || null,
              effective_until: h.effective_until || null,
            };
          }
        });

        userHabits = Object.values(habitMap);


        // Filter habits active today
        const activeTodayHabits = (userHabits || []).filter((h: any) => {
          if (h.is_archived === true) return false;
          if (h.effective_from && h.effective_from > todayStr) return false;
          if (h.effective_until && h.effective_until < todayStr) return false;
          return true;
        });

        // Helper: normalize habit title for category detection
        const detectCategory = (title: string): "prayer" | "quran" | "hadith" | "general" => {
          const t = title.toLowerCase();
          if (t.includes("sholat") || t.includes("salat") || t.includes("prayer") || t.includes("subuh") || t.includes("dzuhur") || t.includes("ashar") || t.includes("maghrib") || t.includes("isya") || t.includes("tahajud") || t.includes("dhuha") || t.includes("witir") || t.includes("tarawih")) return "prayer";
          if (t.includes("quran") || t.includes("qur'an") || t.includes("tilawah") || t.includes("tahsin") || t.includes("tadarus")) return "quran";
          if (t.includes("hadist") || t.includes("hadith") || t.includes("hadis") || t.includes("baca hadis")) return "hadith";
          return "general";
        };

        // Helper: normalize prayer name from title
        const getPrayerKey = (title: string): string | null => {
          const t = title.toLowerCase();
          if (t.includes("subuh")) return "subuh";
          if (t.includes("dzuhur") || t.includes("zuhur")) return "dzuhur";
          if (t.includes("ashar")) return "ashar";
          if (t.includes("maghrib")) return "maghrib";
          if (t.includes("isya")) return "isya";
          if (t.includes("tahajud")) return "tahajud";
          if (t.includes("dhuha")) return "dhuha";
          if (t.includes("witir")) return "witir";
          if (t.includes("tarawih")) return "tarawih";
          return null;
        };

        // Load today's completed status from tracker tables
        const [prayerLogsRes, quranLogsRes, hadithLogsRes] = await Promise.all([
          supabase.from("prayer_logs").select("prayer_name, is_completed").eq("user_id", user.id).eq("date", todayStr).eq("is_completed", true),
          supabase.from("quran_logs").select("id").eq("user_id", user.id).eq("date", todayStr).limit(1),
          supabase.from("hadith_logs").select("is_read").eq("user_id", user.id).eq("date", todayStr).maybeSingle(),
        ]);

        const completedPrayerKeys = new Set((prayerLogsRes.data || []).map((r: any) => r.prayer_name));
        const hasQuranToday = (quranLogsRes.data || []).length > 0;
        const hasHadithToday = hadithLogsRes.data?.is_read === true;

        // Build initial prayerLogsMap for today
        const pMap: Record<string, boolean> = {};
        (prayerLogsRes.data || []).forEach((r: any) => {
          pMap[`${todayStr}_${r.prayer_name}`] = true;
        });
        setPrayerLogsMap(pMap);

        let habitList: { id: string; title: string; completedToday: boolean; completedCount: number; quantity: number; category: string; areaCategory: string }[] = [];

        // Load completed_count from habit_logs for today (for quantity > 1 support)
        const { data: habitLogsToday } = await supabase
          .from("habit_logs")
          .select("habit_id, completed, completed_count")
          .eq("user_id", user.id)
          .eq("date", todayStr);

        const habitLogCountMap: Record<string, number> = {};
        (habitLogsToday || []).forEach((hl: any) => {
          habitLogCountMap[hl.habit_id] = hl.completed_count || (hl.completed ? 1 : 0);
        });

        if (activeTodayHabits.length > 0) {
          habitList = activeTodayHabits.map((h: any) => {
            const cat = h.area_category === "Spiritual Growth" ? detectCategory(h.title) : "general";
            const qty = h.quantity || 1;
            let completedCount = habitLogCountMap[h.id] || 0;
            let completedToday = false;

            if (cat === "prayer") {
              const key = getPrayerKey(h.title);
              const done = key ? completedPrayerKeys.has(key) : false;
              completedToday = done;
              completedCount = done ? qty : 0;
            } else if (cat === "quran") {
              completedToday = hasQuranToday;
              completedCount = hasQuranToday ? qty : 0;
            } else if (cat === "hadith") {
              completedToday = hasHadithToday;
              completedCount = hasHadithToday ? qty : 0;
            } else {
              completedCount = habitLogCountMap[h.id] || 0;
              completedToday = completedCount >= qty;
            }
            return {
              id: h.id,
              title: h.title,
              completedToday,
              completedCount,
              quantity: qty,
              category: cat,
              areaCategory: h.area_category || 'Spiritual Growth',
            };
          });
        }

        setHabits(habitList);
        // Proportional scoring: each habit contributes completedCount/quantity
        const totalScore = habitList.reduce((acc, h) => acc + Math.min(1, h.completedCount / h.quantity), 0);
        const done = habitList.filter((h) => h.completedToday).length;
        setCompletedTodayCount(done);
        setHabitPercentage(
          habitList.length > 0 ? Math.round((totalScore / habitList.length) * 100) : 0
        );

        // 4. Load All Journals & Last Journal
        const { data: journalsData } = await supabase
          .from("journals")
          .select("id, date, content")
          .eq("user_id", user.id)
          .not("content", "is", null)
          .order("created_at", { ascending: false });

        if (journalsData && journalsData.length > 0) {
          setUserJournals(
            journalsData.map((j) => ({
              id: j.id || j.date,
              date: j.date,
              reflection: j.content || "",
            }))
          );
          setJournalLast(journalsData[0].content || "");
          setJournalLastDate(
            new Date(journalsData[0].date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          );
        }
      } catch (err) {
        const error = err as { code?: string; message?: string; details?: string; hint?: string };
        console.error("Error loading dashboard:", {
          code: error?.code,
          message: error?.message || String(err),
          details: error?.details,
          hint: error?.hint,
        });
        setHabitSaveError(`Data habit gagal dimuat${error?.message ? `: ${error.message}` : "."}`);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [supabase]);

  // Helper functions for habit category detection (same as in loadDashboard)
  const detectHabitCategory = (title: string): "prayer" | "quran" | "hadith" | "general" => {
    const t = title.toLowerCase();
    if (t.includes("sholat") || t.includes("salat") || t.includes("prayer") || t.includes("subuh") || t.includes("dzuhur") || t.includes("ashar") || t.includes("maghrib") || t.includes("isya") || t.includes("tahajud") || t.includes("dhuha") || t.includes("witir") || t.includes("tarawih")) return "prayer";
    if (t.includes("quran") || t.includes("qur'an") || t.includes("tilawah") || t.includes("tahsin") || t.includes("tadarus")) return "quran";
    if (t.includes("hadist") || t.includes("hadith") || t.includes("hadis") || t.includes("baca hadis")) return "hadith";
    return "general";
  };

  const getPrayerKeyFromTitle = (title: string): string | null => {
    const t = title.toLowerCase();
    if (t.includes("subuh")) return "subuh";
    if (t.includes("dzuhur") || t.includes("zuhur")) return "dzuhur";
    if (t.includes("ashar")) return "ashar";
    if (t.includes("maghrib")) return "maghrib";
    if (t.includes("isya")) return "isya";
    if (t.includes("tahajud")) return "tahajud";
    if (t.includes("dhuha")) return "dhuha";
    if (t.includes("witir")) return "witir";
    if (t.includes("tarawih")) return "tarawih";
    return null;
  };

  // Realtime handler when prayer is toggled in PrayerTracker
  const handlePrayerToggleFromTracker = (dateStr: string, prayerName: string, isCompleted: boolean) => {
    setPrayerLogsMap((prev) => ({ ...prev, [`${dateStr}_${prayerName}`]: isCompleted }));

    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr !== todayStr) return;

    setHabits((prevHabits) => {
      const updated = prevHabits.map((h) => {
        const cat = detectHabitCategory(h.title);
        if (cat === "prayer") {
          const pKey = getPrayerKeyFromTitle(h.title);
          if (pKey === prayerName) {
            return { ...h, completedToday: isCompleted };
          }
        }
        return h;
      });

      const doneCount = updated.filter((h) => h.completedToday).length;
      setCompletedTodayCount(doneCount);
      setHabitPercentage(
        updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : 0
      );
      return updated;
    });
  };

  // Realtime handler when quran is logged in QuranTracker
  const handleQuranLoggedFromTracker = () => {
    setHabits((prevHabits) => {
      const updated = prevHabits.map((h) => {
        const cat = detectHabitCategory(h.title);
        if (cat === "quran") {
          return { ...h, completedToday: true };
        }
        return h;
      });

      const doneCount = updated.filter((h) => h.completedToday).length;
      setCompletedTodayCount(doneCount);
      setHabitPercentage(
        updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : 0
      );
      return updated;
    });
  };

  // Toggle habit check state — saves to the correct tracker table with realtime sync
  const toggleHabitToday = async (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;
    setHabitSaveError(null);

    const newCompleted = !target.completedToday;
    const updated = habits.map((h) =>
      h.id === habitId ? { ...h, completedToday: newCompleted } : h
    );
    setHabits(updated);

    const doneCount = updated.filter((h) => h.completedToday).length;
    setCompletedTodayCount(doneCount);
    setHabitPercentage(
      updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : 0
    );

    try {
      const cat = target.category;

      // Record to specific tracker tables for specialized widgets
      if (cat === "prayer") {
        const prayerKey = getPrayerKeyFromTitle(target.title);
        if (prayerKey) {
          setPrayerLogsMap((prev) => ({ ...prev, [`${todayStr}_${prayerKey}`]: newCompleted }));
          if (newCompleted) {
            const { error } = await supabase.from("prayer_logs").upsert(
              { user_id: userId, date: todayStr, prayer_name: prayerKey, is_completed: true },
              { onConflict: "user_id,date,prayer_name" }
            );
            if (error) throw error;
          } else {
            const { error } = await supabase.from("prayer_logs")
              .update({ is_completed: false })
              .eq("user_id", userId)
              .eq("date", todayStr)
              .eq("prayer_name", prayerKey);
            if (error) throw error;
          }
        }
      } else if (cat === "quran") {
        if (newCompleted) {
          const { data: existing } = await supabase.from("quran_logs")
            .select("id").eq("user_id", userId).eq("date", todayStr).limit(1);
          if (!existing || existing.length === 0) {
            const { error } = await supabase.from("quran_logs").insert({
              user_id: userId,
              date: todayStr,
              surah_name: "(Dari Habit PTP)",
              total_ayat: 0,
              from_ayat: 0,
              to_ayat: 0,
            });
            if (error) throw error;
          }
        } else {
          const { error } = await supabase.from("quran_logs")
            .delete()
            .eq("user_id", userId)
            .eq("date", todayStr)
            .eq("surah_name", "(Dari Habit PTP)");
          if (error) throw error;
        }
      } else if (cat === "hadith") {
        const { error } = await supabase.from("hadith_logs").upsert(
          { user_id: userId, date: todayStr, is_read: newCompleted },
          { onConflict: "user_id,date" }
        );
        if (error) throw error;
      }

      // Record to habit_logs using select + insert/update/delete pattern (compatible with or without UNIQUE constraint)
      const newCount = newCompleted ? target.quantity : 0;
      const { data: existingHL } = await supabase
        .from("habit_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("habit_id", habitId)
        .eq("date", todayStr)
        .maybeSingle();

      if (existingHL) {
        if (newCompleted || newCount > 0) {
          const { error } = await supabase.from("habit_logs").update({ completed: newCompleted, completed_count: newCount }).eq("id", existingHL.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("habit_logs").delete().eq("id", existingHL.id);
          if (error) throw error;
        }
      } else if (newCompleted || newCount > 0) {
        const { error } = await supabase.from("habit_logs").insert({
          user_id: userId,
          habit_id: habitId,
          date: todayStr,
          completed: newCompleted,
          completed_count: newCount,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Gagal menyimpan checklist habit:", err);
      setHabitSaveError("Checklist gagal disimpan. Periksa koneksi lalu coba lagi.");
      setHabits(habits);
      const totalScore = habits.reduce((acc, h) => acc + Math.min(1, h.completedCount / h.quantity), 0);
      setCompletedTodayCount(habits.filter((h) => h.completedToday).length);
      setHabitPercentage(habits.length > 0 ? Math.round((totalScore / habits.length) * 100) : 0);
    }
  };

  // Increment one sub-step for habits with quantity > 1
  const incrementHabitCount = async (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const target = habits.find((h) => h.id === habitId);
    if (!target || target.category !== 'general') return;
    setHabitSaveError(null);

    const newCount = Math.min(target.quantity, (target.completedCount || 0) + 1);
    const newCompleted = newCount >= target.quantity;

    const updated = habits.map((h) =>
      h.id === habitId ? { ...h, completedCount: newCount, completedToday: newCompleted } : h
    );
    setHabits(updated);

    const totalScore = updated.reduce((acc, h) => acc + Math.min(1, h.completedCount / h.quantity), 0);
    const doneCount = updated.filter((h) => h.completedToday).length;
    setCompletedTodayCount(doneCount);
    setHabitPercentage(updated.length > 0 ? Math.round((totalScore / updated.length) * 100) : 0);

    try {
      const { data: existingHL } = await supabase
        .from("habit_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("habit_id", habitId)
        .eq("date", todayStr)
        .maybeSingle();

      if (existingHL) {
        const { error } = await supabase.from("habit_logs").update({ completed: newCompleted, completed_count: newCount }).eq("id", existingHL.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_logs").insert({
          user_id: userId,
          habit_id: habitId,
          date: todayStr,
          completed: newCompleted,
          completed_count: newCount,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Gagal simpan sub-step:", err);
      setHabitSaveError("Progress habit gagal disimpan. Periksa koneksi lalu coba lagi.");
      setHabits(habits);
      const totalScore = habits.reduce((acc, h) => acc + Math.min(1, h.completedCount / h.quantity), 0);
      setCompletedTodayCount(habits.filter((h) => h.completedToday).length);
      setHabitPercentage(habits.length > 0 ? Math.round((totalScore / habits.length) * 100) : 0);
    }
  };

  // Toggle pin journal
  const togglePinJournal = (id: string) => {
    let nextPinned: string[];
    if (pinnedIds.includes(id)) {
      nextPinned = pinnedIds.filter((p) => p !== id);
    } else {
      nextPinned = [...pinnedIds, id];
    }
    setPinnedIds(nextPinned);
    if (userId) {
      localStorage.setItem(`slj_pinned_${userId}`, JSON.stringify(nextPinned));
    }
  };

  const handleRemindSafar = async () => {
    setSafarRemindedToday(true);
    if (!userId) return;
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      // Find Sahabat Safar user_id from support_team
      const { data: team } = await supabase
        .from("support_team")
        .select("sahabat_safar_user_id, sahabat_safar_name")
        .eq("user_id", userId)
        .maybeSingle();

      const targetId = team?.sahabat_safar_user_id;

      await supabase.from("safar_reminders").insert({
        user_id: userId,
        sahabat_safar_user_id: targetId || null,
        date: todayStr,
        reminded_at: new Date().toISOString(),
      });

      // If target Sahabat Safar account exists, send notification to them
      if (targetId) {
        await supabase.from("notifications").insert({
          user_id: targetId,
          title: "💛 Pengingat dari Sahabat Safar",
          message: `${userName} mengingatkan Anda untuk tetap konsisten dan semangat menjalankan PTP hari ini!`,
          category: "reminder",
          is_read: false,
        });
      }
    } catch (err) {
      console.log("Remind safar log:", err);
    }
  };

  // Save new reflection journal
  const handleSaveJournal = async () => {
    if (!journalContent.trim() || !userId) return;
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const { error } = await supabase.from("journals").insert({
        user_id: userId,
        date: todayStr,
        content: journalContent,
        is_private: true,
      });
      if (error) throw error;

      setJournalLast(journalContent);
      setJournalLastDate(
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );

      // Add to list
      const newItem = {
        id: todayStr,
        date: todayStr,
        reflection: journalContent,
      };
      setUserJournals((prev) => [
        newItem,
        ...prev.filter((j) => j.date !== todayStr),
      ]);

      setJournalContent("");
      setWriteJournalOpen(false);
    } catch (e) {
      console.error("Gagal simpan jurnal:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Filtered journals
  const sortedJournals = [...userJournals].sort((a, b) => {
    const isAPinned = pinnedIds.includes(a.id);
    const isBPinned = pinnedIds.includes(b.id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const filteredJournals = sortedJournals.filter((j) =>
    j.reflection.toLowerCase().includes(journalSearch.toLowerCase())
  );

  return (
    <ParticipantLayout activePath="/dashboard">
      <div className="space-y-7 max-w-6xl w-full mx-auto pb-10 md:pb-0">
        {/* ─── UNIFIED 16:9 HERO BANNER ─── */}
        <div
          className="relative rounded-3xl overflow-hidden text-white p-3.5 sm:p-8 md:p-10 shadow-lg border border-white/15 transition-all duration-700 aspect-auto md:aspect-[16/9] w-full flex flex-col justify-between bg-cover bg-center min-h-[260px] sm:min-h-[360px] md:min-h-[440px]"
          style={{ backgroundImage: `url('${adaptiveHeroBgImage}')` }}
        >
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/60 pointer-events-none"></div>

          {/* TOP ROW: Greeting (Top-Left) & Next Prayer (Top-Right) */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4">
            {/* Left: Day badge (TOP) & Assalamu'alaikum Greeting (BOTTOM) */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-amber-900 font-extrabold bg-amber-400/90 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs shadow-2xs whitespace-nowrap">
                  Hari ke-{dayCount} dari 90
                </span>
                <button
                  type="button"
                  onClick={handleRemindSafar}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-sm ${
                    safarRemindedToday
                      ? "bg-emerald-500/90 text-white border border-emerald-300"
                      : "bg-white/20 hover:bg-white/30 text-amber-200 border border-white/30 backdrop-blur-md"
                  }`}
                >
                  <Heart className={`h-3 w-3 ${safarRemindedToday ? "fill-white text-white" : "text-amber-300"}`} />
                  <span>{safarRemindedToday ? "Ingatkan Sahabat Safar (Terkirim)" : "Ingatkan Sahabat Safar"}</span>
                  {safarRemindedToday && <Check className="h-3 w-3 text-white ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsScreenSaver(true)}
                  className="inline-flex items-center justify-center p-1.5 rounded-full text-white/70 hover:text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
                  title="Aktifkan Mode Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>

              <h1 className="text-lg sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight pt-0.5">
                Assalamu&apos;alaikum, {userName.split(" ")[0]}!
              </h1>
            </div>

            {/* Right: Next Prayer Card (Desktop Only: inside Hero top-right) */}
            <div className={`hidden sm:flex p-2.5 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-md items-center justify-between gap-2 sm:gap-3 shrink-0 shadow-md transition-all duration-500 w-auto sm:min-w-[240px] md:min-w-[260px] sm:max-w-[280px] ${
              nextPrayerInfo.isGracePeriod
                ? "bg-emerald-950/80 border border-emerald-400/60 shadow-emerald-950/40 p-4"
                : "bg-black/20 border border-white/15"
            }`}>
              {/* Left: Prayer Icon (Only when NOT grace period) */}
              {!nextPrayerInfo.isGracePeriod && (
                <div className="h-10 sm:h-14 md:h-16 w-auto shrink-0 flex items-center justify-center">
                  <img
                    src={prayerIconMap[nextPrayerInfo.name] || "/icon_subuh.webp"}
                    alt={nextPrayerInfo.name}
                    className="h-10 sm:h-14 md:h-16 w-auto object-contain drop-shadow-xl"
                  />
                </div>
              )}

              {/* Center: Prayer Details */}
              {nextPrayerInfo.isGracePeriod ? (
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] sm:text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1 leading-none animate-pulse">
                    <Sparkles className="h-3 w-3 text-amber-300" /> Waktu Sholat Tiba
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white block leading-snug">
                    Selamat Menunaikan Ibadah Sholat {nextPrayerInfo.name}
                  </span>
                </div>
              ) : (
                <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider block leading-none">
                    Sholat Berikutnya
                  </span>
                  <span className="text-sm sm:text-xl font-black text-white block leading-tight truncate">
                    {nextPrayerInfo.name}
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 block leading-none">
                    {nextPrayerInfo.time}
                  </span>
                </div>
              )}

              {/* Right: Circular Progress with Countdown (Only when NOT grace period) */}
              {!nextPrayerInfo.isGracePeriod && (
                <div className="flex flex-col items-center shrink-0 gap-0.5">
                  <div className="relative h-11 w-11 sm:h-14 sm:w-14">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="url(#prayerGrad)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - nextPrayerProgress / 100)}`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="prayerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FBBF24" />
                          <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-black text-amber-300 leading-none text-center px-0.5">
                        {nextPrayerInfo.text}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 hidden sm:inline">sisa waktu</span>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ROW: Digital Clock (Bottom-Left) & Progress Card (Bottom-Right) */}
          <div className="relative z-10 flex flex-row items-end justify-between gap-2 sm:gap-6 mt-auto pt-3">
            {/* Left: Big Clock + Date & :Seconds WIB below */}
            <div className="space-y-0.5 sm:space-y-1.5 pb-0.5 min-w-0">
              <h2 className="text-3xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white font-mono tracking-tighter drop-shadow-lg leading-none">
                {heroClockMain}
              </h2>
              <div className="flex flex-wrap items-baseline gap-1 sm:gap-2.5 pt-0.5">
                <span className="text-xs sm:text-base font-bold text-amber-200/90 truncate">{heroDate}</span>
                <span className="text-white/30 text-xs sm:text-lg">|</span>
                <span className="text-xs sm:text-3xl font-mono font-bold text-white/80">:{heroClockSeconds}</span>
                <span className="text-xs sm:text-3xl font-mono font-bold text-white/80">{timeZoneStr}</span>
              </div>
            </div>

            {/* Right: Progress Hari Ini Card */}
            <div className="bg-black/20 p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-white/15 backdrop-blur-md space-y-1.5 sm:space-y-3 shrink-0 w-36 sm:w-auto min-w-0 sm:min-w-[260px] md:max-w-xs shadow-md">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
                  Progress Hari Ini
                </span>
                <button
                  onClick={() => setTodayTasksModalOpen(true)}
                  className="p-0.5 sm:p-1 rounded-md sm:rounded-lg bg-white/15 hover:bg-white/30 text-white transition-all border border-white/20 cursor-pointer"
                  title="Lihat Selengkapnya"
                >
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>

              <div className="flex items-baseline space-x-1 sm:space-x-2">
                <span className="text-base sm:text-3xl font-black text-white">
                  {completedTodayCount}
                </span>
                <span className="text-[10px] sm:text-sm text-slate-300 font-bold">
                  / {habits.length} selesai
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/20 h-1.5 sm:h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-200 h-full rounded-full transition-all duration-500"
                  style={{ width: `${habitPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BARIS 1: 3 CARDS BENTO (JADWAL SHOLAT, HABITS HARI INI, HADITS HARI INI) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Card 1: Jadwal Sholat Hari Ini */}
          <PrayerTimesWidget
            location={userLocation}
            onViewAll={() => setAllPrayerModalOpen(true)}
          />

          {/* Card 2: Habits Hari Ini (Participant PTP Habits) */}
          <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-warm-border/60 pb-3">
                <h3 className="font-extrabold text-navy-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Habits Hari Ini
                </h3>
                <span className="text-[11px] font-bold text-gray-500 bg-warm-bg px-2.5 py-1 rounded-full border border-warm-border">
                  {habits.length} kebiasaan
                </span>
              </div>

              {habits.length === 0 ? (
                <div className="py-8 text-center space-y-3 border border-dashed border-warm-border rounded-xl p-4 bg-warm-bg/40">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Belum ada kebiasaan yang ditentukan di PTP.
                  </p>
                  <Link href="/journey" className="inline-block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold rounded-xl border-amber-400 text-navy-900 hover:bg-amber-50"
                    >
                      + Tentukan Habit di PTP
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Progress Ring & Counter */}
                  <div className="flex items-center space-x-4 bg-amber-50/50 p-3 rounded-xl border border-amber-200/50">
                    <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-amber-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-amber-500"
                          strokeDasharray={`${habitPercentage}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-navy-900 leading-none">
                          {completedTodayCount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">Selesai</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-navy-900 block">
                        {completedTodayCount === habits.length
                          ? "MasyaAllah! Semua Habit Selesai"
                          : `${habits.length - completedTodayCount} Habit Belum Selesai`}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Habit yang Anda tentukan di PTP.
                      </p>
                    </div>
                  </div>

                  {habitSaveError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                      {habitSaveError}
                    </div>
                  )}

                  {/* Habit Checklist Preview — supports quantity sub-step counter */}
                  <div className="space-y-1.5 pt-1">
                    {habits.slice(0, 5).map((h) => {
                      const isMultiStep = h.category === 'general' && h.quantity > 1;
                      return (
                        <div
                          key={h.id}
                          className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                            h.completedToday
                              ? "bg-emerald-50/70 text-emerald-900 border border-emerald-200/60"
                              : "bg-warm-bg text-slate-700 border border-warm-border/60"
                          }`}
                        >
                          <span className="truncate flex-1">{h.title}</span>
                          {isMultiStep ? (
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                h.completedToday ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-600"
                              }`}>
                                {h.completedCount}/{h.quantity}
                              </span>
                              {!h.completedToday && (
                                <button
                                  onClick={() => incrementHabitCount(h.id)}
                                  className="h-5 w-5 rounded-full bg-amber-400 text-white flex items-center justify-center hover:bg-amber-500 transition-colors font-bold text-xs"
                                  title={`Tandai +1 (${h.completedCount+1}/${h.quantity})`}
                                >
                                  +
                                </button>
                              )}
                              {h.completedToday && <Check className="h-3 w-3 text-emerald-600 stroke-[3] shrink-0" />}
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleHabitToday(h.id)}
                              className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                                h.completedToday
                                  ? "bg-emerald-600 text-white"
                                  : "border border-slate-300 bg-white hover:border-amber-400"
                              }`}
                            >
                              {h.completedToday && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer link */}
            <div className="pt-3 border-t border-warm-border/60">
              <button
                onClick={() => setTodayTasksModalOpen(true)}
                className="text-xs font-bold text-navy-900 hover:text-amber-700 flex items-center justify-between w-full transition-colors"
              >
                <span>Lihat Detail Habit</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>

          {/* Card 3: Hadits Hari Ini (Clickable to open Analytics) */}
          <div
            onClick={() => setHadithAnalyticsOpen(true)}
            className="cursor-pointer group relative transition-all hover:scale-[1.005]"
            title="Klik untuk membuka Analitik & Tadabbur Hadits"
          >
            <DailyHadithWidget userId={userId} />
          </div>
        </div>

        {/* ─── BARIS 2: 2 CARDS BENTO (TRACKING SHOLAT & TILAWAH AL-QUR'AN) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Tracking Sholat */}
          <div className="relative group">
            <button
              onClick={() => setSholatAnalyticsOpen(true)}
              title="Buka Analitik Sholat"
              className="absolute top-4.5 right-4 z-20 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer p-1"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <PrayerTracker
              userId={userId}
              accountCreatedDate={accountCreatedDate}
              externalLogs={prayerLogsMap}
              onPrayerToggle={handlePrayerToggleFromTracker}
            />
          </div>

          {/* Card 2: Tilawah Al-Qur'an (Clickable to open Analytics) */}
          <div
            onClick={() => setQuranAnalyticsOpen(true)}
            className="relative group cursor-pointer transition-all hover:scale-[1.005]"
            title="Klik untuk membuka Analitik Tilawah Al-Qur'an"
          >
            <QuranTracker userId={userId} onQuranLogged={handleQuranLoggedFromTracker} />
          </div>
        </div>

        {/* ─── BARIS 3: 2 CARDS BENTO (PROGRESS JOURNEY & JOURNAL REFLEKSI) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Progress Journey (Total Progress 90 Hari - Countdown) */}
          <Card className="bg-white border-warm-border p-6 rounded-2xl shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-warm-border/60 pb-3">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-xs tracking-wider uppercase">
                    Progress Journey
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Countdown Sisa Hari Menuju 90 Hari
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                  {Math.max(0, 90 - dayCount)} Hari Lagi
                </Badge>
              </div>

              {/* Countdown Big Display */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-black text-navy-900 tracking-tight">
                    {Math.max(0, 90 - dayCount)}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    hari tersisa (Hari ke-{dayCount} dari 90)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress value={Math.min(100, Math.round((dayCount / 90) * 100))} className="h-3 bg-warm-bg" />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                  <span>Hari 1 (Start)</span>
                  <span className="font-bold text-amber-700">Hari 90 (Finish)</span>
                </div>
              </div>

              {/* 3 Micro Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-warm-bg p-3 rounded-xl border border-warm-border/60">
                  <span className="text-lg font-black text-navy-900 block">{dayCount} Hari</span>
                  <span className="text-[10px] text-slate-500 font-bold block leading-tight">
                    berturut-turut berjalan
                  </span>
                </div>
                <div className="bg-warm-bg p-3 rounded-xl border border-warm-border/60">
                  <span className="text-lg font-black text-navy-900 block">
                    {completedTodayCount}/{habits.length}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block leading-tight">
                    Checklist Selesai Hari Ini
                  </span>
                </div>
                <div className="bg-warm-bg p-3 rounded-xl border border-warm-border/60">
                  <span className="text-lg font-black text-emerald-700 block">
                    {dayCount >= 30 ? "Check 1" : "Aktif"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block leading-tight">
                    Checkpoint Status
                  </span>
                </div>
              </div>
            </div>

            {/* Clickable button to open Analytics Modal */}
            <div className="pt-3 border-t border-warm-border/60">
              <Button
                onClick={() => setAnalyticsModalOpen(true)}
                variant="outline"
                className="w-full justify-between text-xs font-bold text-navy-900 border-warm-border hover:bg-warm-bg rounded-xl py-2.5"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  Lihat Analitik Lengkap
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          </Card>

          {/* Card 2: Journal Refleksi (Displays user reflections + Pin Journal) */}
          <Card className="bg-white border-warm-border p-6 rounded-2xl shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-warm-border/60 pb-3">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-xs tracking-wider uppercase">
                    Journal Refleksi
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tulis refleksi harian Anda
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setWriteJournalOpen(true)}
                  className="bg-navy-900 hover:bg-black text-amber-300 font-bold text-xs rounded-xl gap-1.5 px-3 py-1.5"
                >
                  + Tulis Refleksi
                </Button>
              </div>

              {/* Reflection Card Preview */}
              {journalLast ? (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                      Refleksi Terakhir ({journalLastDate})
                    </span>
                    {pinnedIds.includes(journalLastDate) && (
                      <Pin className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
                    )}
                  </div>
                  <p className="text-xs text-navy-900 font-serif leading-relaxed italic line-clamp-3">
                    &ldquo;{journalLast}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-warm-bg/40">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    Belum ada jurnal hari ini.
                  </p>
                </div>
              )}
            </div>

            {/* Clickable button to open full journal page */}
            <div className="pt-3 border-t border-warm-border/60">
              <Link href="/journal" className="w-full block">
                <Button
                  variant="outline"
                  className="w-full justify-between text-xs font-bold text-navy-900 border-warm-border hover:bg-warm-bg rounded-xl py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-amber-600" />
                    Buka Halaman Journal ({userJournals.length} catatan)
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* ─── BARIS 4: 1 CARD PANJANG HADITS ATAU PEPATAH TENTANG KONSISTENSI ─── */}
        <Card className="bg-white border-warm-border p-5 md:p-6 rounded-2xl shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-navy-900 font-serif italic font-semibold leading-relaxed">
                &ldquo;Dan barang siapa bertakwa kepada Allah, niscaya Dia akan menjadikan baginya jalan keluar.&rdquo;
              </p>
              <span className="text-[11px] font-bold text-slate-500 block">
                (QS. At-Talaq: 2) &bull; &ldquo;Amalan yang paling dicintai Allah adalah amalan yang kontinyu meskipun sedikit.&rdquo; (HR. Muslim)
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── ALL MODALS ─── */}

      {/* 1. MODAL ALL JOURNALS REFLEKSI WITH PIN FEATURE */}
      <Dialog open={allJournalsModalOpen} onOpenChange={setAllJournalsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b border-warm-border">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-amber-600" />
              Semua Catatan Journal Refleksi
            </DialogTitle>
          </DialogHeader>

          {/* Search bar */}
          <div className="py-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <Input
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                placeholder="Cari catatan refleksi..."
                className="pl-9 text-xs rounded-xl border-warm-border"
              />
            </div>
            <Button
              onClick={() => {
                setAllJournalsModalOpen(false);
                setWriteJournalOpen(true);
              }}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl"
            >
              + Refleksi Baru
            </Button>
          </div>

          {/* List of journal cards */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredJournals.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-400 text-xs italic">
                Belum ada jurnal yang tersimpan.
              </div>
            ) : (
              filteredJournals.map((item) => {
                const isPinned = pinnedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPinned
                        ? "bg-amber-50/80 border-amber-300 shadow-2xs"
                        : "bg-white border-warm-border hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-warm-border/50 pb-2 mb-2">
                      <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" />
                        {new Date(item.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => togglePinJournal(item.id)}
                        className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                          isPinned
                            ? "bg-amber-200 text-amber-900 font-bold"
                            : "text-slate-400 hover:text-navy-900 hover:bg-warm-bg"
                        }`}
                        title={isPinned ? "Lepas Pin" : "Sematkan Journal"}
                      >
                        <Pin
                          className={`h-3.5 w-3.5 ${
                            isPinned ? "fill-amber-900" : ""
                          }`}
                        />
                        <span>{isPinned ? "Tersemat" : "Pin"}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 font-serif italic leading-relaxed whitespace-pre-wrap">
                      &ldquo;{item.reflection}&rdquo;
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setAllJournalsModalOpen(false)}
              variant="outline"
              className="text-xs rounded-xl"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. MODAL DASHBOARD ANALITIK LENGKAP */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-lg font-black text-navy-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              Dashboard Analitik Perjalanan 90 Hari
            </DialogTitle>
          </DialogHeader>

          {/* Overview Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-navy-900 text-white p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-black text-amber-300 block">
                {progressPercent}%
              </span>
              <span className="text-[10px] text-slate-300 font-bold uppercase block">
                Total Perjalanan
              </span>
            </div>
            <div className="bg-warm-bg border border-warm-border p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-black text-navy-900 block">
                {dayCount}/90
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Hari Berjalan
              </span>
            </div>
            <div className="bg-warm-bg border border-warm-border p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-black text-emerald-700 block">
                {habitPercentage}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Tingkat Habit
              </span>
            </div>
            <div className="bg-warm-bg border border-warm-border p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-black text-amber-700 block">
                {userJournals.length}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Refleksi Journal
              </span>
            </div>
          </div>

          {/* Phase Milestones Breakdown */}
          <div className="space-y-3 border-t border-warm-border pt-4">
            <h4 className="text-xs font-extrabold text-navy-900 uppercase tracking-wider">
              Status Checkpoint & Evaluasi Bulanan
            </h4>

            <div className="space-y-2.5">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 block">
                      Checkpoint 1 (Hari ke-30) &bull; Fondasi & Niat
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Evaluasi keselarasan PTP & kebiasaan awal
                    </span>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  ON TRACK
                </Badge>
              </div>

              <div className="bg-warm-bg border border-warm-border p-3.5 rounded-xl flex items-center justify-between text-xs opacity-80">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 block">
                      Checkpoint 2 (Hari ke-60) &bull; Puncak Mujahadah
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Mendatang &bull; Pertahankan konsistensi
                    </span>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-800 font-bold text-[10px]">
                  MENUNGGU
                </Badge>
              </div>

              <div className="bg-warm-bg border border-warm-border p-3.5 rounded-xl flex items-center justify-between text-xs opacity-60">
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 block">
                      Checkpoint 3 (Hari ke-90) &bull; Istiqamah Sejati
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Final review & penyusunan action plan mandiri
                    </span>
                  </div>
                </div>
                <Badge className="bg-slate-200 text-slate-700 font-bold text-[10px]">
                  MENUNGGU
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setAnalyticsModalOpen(false)}
              className="bg-navy-900 text-white font-bold text-xs rounded-xl"
            >
              Tutup Analitik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MODAL TODAY'S TASKS & HABITS DETAIL */}
      <Dialog open={todayTasksModalOpen} onOpenChange={setTodayTasksModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Detail Habits Hari Ini
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-navy-900">
              <span>Status Penyelesaian:</span>
              <span className="text-amber-800 font-black">
                {completedTodayCount} dari {habits.length} ({habitPercentage}%)
              </span>
            </div>
            <Progress value={habitPercentage} className="h-2.5 bg-warm-bg" />

            <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-1">
              {habits.map((h) => {
                const isMultiStep = h.category === "general" && h.quantity > 1;
                return (
                  <button
                    key={h.id}
                    onClick={() => isMultiStep && !h.completedToday ? incrementHabitCount(h.id) : toggleHabitToday(h.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all text-left ${
                      h.completedToday
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        : "bg-warm-bg text-slate-700 border border-warm-border hover:bg-slate-100"
                    }`}
                  >
                    <span>{h.title}</span>
                    {isMultiStep && !h.completedToday ? (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] text-slate-700">{h.completedCount}/{h.quantity} +</span>
                    ) : (
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${h.completedToday ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"}`}>
                        {h.completedToday && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setTodayTasksModalOpen(false)}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl w-full"
            >
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. MODAL PEPATAH KONSISTENSI & HADITS */}
      <Dialog open={consistencyModalOpen} onOpenChange={setConsistencyModalOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Pepatah & Hadits Tentang Konsistensi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                AL-QUR'AN SURAH AT-TALAQ AYAT 2-3
              </span>
              <p className="text-sm font-serif italic text-navy-900 leading-relaxed">
                &ldquo;Dan barang siapa bertakwa kepada Allah, niscaya Dia akan menjadikan baginya jalan keluar, dan memberinya rezeki dari arah yang tidak disangka-sangka.&rdquo;
              </p>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-[10px] font-bold text-navy-900 uppercase tracking-widest block">
                HADITS RIWAYAT MUSLIM
              </span>
              <p className="text-xs font-serif italic text-slate-800 leading-relaxed">
                &ldquo;Amalan yang paling dicintai oleh Allah Ta&apos;ala adalah amalan yang berkelanjutan (istiqamah) meskipun sedikit.&rdquo;
              </p>
              <p className="text-[11px] text-slate-500">
                Prinsip ini menjadi dasar metode SLJ: membangun kebiasaan kecil yang konsisten setiap hari selama 90 hari.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setConsistencyModalOpen(false)}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl w-full"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL WRITE REFLECTION JOURNAL */}
      <Dialog open={writeJournalOpen} onOpenChange={setWriteJournalOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900">
              Tulis Refleksi Journal Hari Ini
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">
              Refleksi, rasa syukur, atau pembelajaran hari ini:
            </label>
            <Textarea
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Apa hal terbaik atau evaluasi penting dari perjalananmu hari ini?..."
              className="text-xs min-h-[140px] rounded-xl border-warm-border"
            />
          </div>
          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={handleSaveJournal}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl w-full"
            >
              Simpan Refleksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── FULLSCREEN SCREEN SAVER OVERLAY MODAL ─── */}
      {isScreenSaver && (
        <div
          className="fixed inset-0 z-50 bg-black bg-cover bg-center text-white flex flex-col justify-between p-6 sm:p-12 md:p-16 animate-in fade-in duration-300 select-none overflow-hidden"
          style={{ backgroundImage: `url('${adaptiveHeroBgImage}')` }}
        >
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70 pointer-events-none" />

          {/* Top Bar: Title & Exit Button */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-amber-900 font-extrabold bg-amber-400 px-3.5 py-1 rounded-full text-xs shadow-md">
                Hari ke-{dayCount} dari 90
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-300 hidden sm:inline">
                Spiritual Leadership Journey
              </span>
            </div>

            <button
              onClick={() => setIsScreenSaver(false)}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-full text-xs font-extrabold backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <Minimize2 className="h-4 w-4 text-amber-300" />
              <span>Keluar Screen Saver (ESC)</span>
            </button>
          </div>

          {/* Center / Giant Digital Clock */}
          <div className="relative z-10 my-auto text-center space-y-4 py-8">
            <h1 className="text-6xl sm:text-9xl md:text-[12rem] font-black font-mono tracking-tighter text-white drop-shadow-2xl leading-none">
              {heroClockMain}
            </h1>
            <div className="flex items-center justify-center gap-3 text-amber-300 font-mono text-2xl sm:text-4xl md:text-5xl font-bold">
              <span>:{heroClockSeconds}</span>
              <span className="text-sm sm:text-xl font-sans bg-black/40 border border-amber-300/40 text-amber-200 px-3 py-0.5 rounded-lg backdrop-blur-md">
                {timeZoneStr}
              </span>
            </div>
            <p className="text-sm sm:text-xl text-slate-200 font-semibold pt-2">
              📅 {heroDate}
            </p>
          </div>

          {/* Bottom Bar: Prayer Info & Ticker */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/20 pt-6">
            <div className="flex items-center gap-3">
              <img
                src={prayerIconMap[nextPrayerInfo.name] || "/icon_subuh.webp"}
                alt={nextPrayerInfo.name}
                className="h-12 w-12 object-contain drop-shadow-xl"
              />
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {nextPrayerInfo.isGracePeriod ? "Waktu Sholat" : "Sholat Berikutnya"}
                </span>
                <span className="text-lg sm:text-2xl font-black text-white">
                  {nextPrayerInfo.name} ({nextPrayerInfo.time})
                </span>
              </div>
            </div>

            {nextPrayerInfo.isGracePeriod ? (
              <div className="bg-emerald-500/90 border border-emerald-300 text-white font-black text-sm px-5 py-2.5 rounded-2xl shadow-xl animate-pulse">
                🤲 {nextPrayerInfo.graceMessage}
              </div>
            ) : (
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase block">Menghitung Mundur</span>
                <span className="text-xl sm:text-3xl font-black font-mono text-amber-300">{nextPrayerInfo.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DEDICATED ANALYTICS MODAL: SHOLAT ─── */}
      <Dialog open={sholatAnalyticsOpen} onOpenChange={setSholatAnalyticsOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Analitik Khusus Sholat (Wajib & Sunnah)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xl font-black text-amber-900 block">94%</span>
                <span className="text-[10px] text-slate-500 font-bold block">Tingkat Sholat Wajib</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-navy-900 block">5 Waktu</span>
                <span className="text-[10px] text-slate-500 font-bold block">Istiqamah Berjamaah</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">+3 Sunnah</span>
                <span className="text-[10px] text-slate-500 font-bold block">Rata-rata Harian</span>
              </div>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 block">Ringkasan Konsistensi 7 Hari Terakhir</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sholat Subuh, Dzuhur, Ashar, Maghrib, dan Isya tercatat konsisten. Sholat Sunnah Rawatib dan Dhuha paling sering ditambahkan dalam tracker.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setSholatAnalyticsOpen(false)}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl w-full"
            >
              Tutup Analitik Sholat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DEDICATED ANALYTICS MODAL: TILAWAH AL-QURAN ─── */}
      <Dialog open={quranAnalyticsOpen} onOpenChange={setQuranAnalyticsOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-600" />
              Analitik Khusus Tilawah Al-Qur'an
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xl font-black text-amber-900 block">12 Juz</span>
                <span className="text-[10px] text-slate-500 font-bold block">Total Tilawah</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-navy-900 block">2 Halaman</span>
                <span className="text-[10px] text-slate-500 font-bold block">Target Harian PTP</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">100%</span>
                <span className="text-[10px] text-slate-500 font-bold block">Pencapaian Pekan Ini</span>
              </div>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 block">Progres Tilawah & Khatam</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log tilawah harian terekam otomatis saat Anda melakukan checklist pada widget Tilawah Al-Qur'an.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setQuranAnalyticsOpen(false)}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl w-full"
            >
              Tutup Analitik Tilawah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DEDICATED ANALYTICS MODAL: BACA HADITS ─── */}
      <Dialog open={hadithAnalyticsOpen} onOpenChange={setHadithAnalyticsOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Analitik Khusus Baca & Tadabbur Hadits
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xl font-black text-amber-900 block">14 Hadits</span>
                <span className="text-[10px] text-slate-500 font-bold block">Telah Dibaca</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-navy-900 block">1 Hadits/Hari</span>
                <span className="text-[10px] text-slate-500 font-bold block">Rata-rata Rutin</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">89%</span>
                <span className="text-[10px] text-slate-500 font-bold block">Tingkat Pemahaman</span>
              </div>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 block">Tadabbur & Pilihan Tema</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hadits harian menyajikan kutipan riwayat sahih seputar niat, akhlak kepemimpinan, dan keistiqamahan amalan.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-warm-border">
            <Button
              onClick={() => setHadithAnalyticsOpen(false)}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl w-full"
            >
              Tutup Analitik Hadits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ParticipantLayout>
  );
}
