"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { normalizeTransformationArea } from "@/lib/transformation-areas";
import { calculateExecution } from "@/lib/execution";
import AreaProgressGraph from "@/components/AreaProgressGraph";
import { composeJournalContent, getCanonicalJournalDate, parseJournalContent } from "@/lib/journal";
import { getActiveProgramMonth, getProgramDay } from "@/lib/program-timeline";
import { DEFAULT_TIME_ZONE, getHabitOccurrenceKey, getLocalDateString, getLocalDateRange, normalizeHabitFrequency, resolveParticipantTimeZone } from "@/lib/local-date";
import { AdaptiveJourneyHero } from "@/components/domain/AdaptiveJourneyHero";
import { getTrialProgress, type SljAccess } from "@/lib/program-access";
import { TrialAreaPreview } from "@/components/domain/TrialAreaPreview";
import { DashboardShortcuts, DASHBOARD_WIDGETS, type DashboardWidget } from "@/components/domain/DashboardShortcuts";
import { detectHabitCategory, getPrayerKeyFromHabitTitle } from "@/lib/habit-tracking";
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
  Bell,
  Maximize2,
  X,
  Edit3,
  Lock,
} from "lucide-react";

export function ParticipantDashboard({ trialAccess }: { trialAccess?: SljAccess }) {
  const isTrial = trialAccess?.kind === "trial";
  const totalDays = isTrial ? 14 : 90;
  const trialProgress = trialAccess ? getTrialProgress(trialAccess) : null;

  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState("Peserta");
  const [userLocation, setUserLocation] = useState("Jakarta");
  const [userTimeZone, setUserTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [dayCount, setDayCount] = useState(trialProgress?.day ?? 1);
  const remainingDays = trialProgress?.remainingDays ?? Math.max(0, totalDays - dayCount);

  // Journal state
  const [journalContent, setJournalContent] = useState("");
  const [journalLast, setJournalLast] = useState("");
  const [journalLastDate, setJournalLastDate] = useState("");
  const [writeJournalOpen, setWriteJournalOpen] = useState(false);
  const [allJournalsModalOpen, setAllJournalsModalOpen] = useState(false);
  const [userJournals, setUserJournals] = useState<
    { id: string; date: string; reflection: string; lesson: string; improvement: string; isPrivate: boolean; isPinned?: boolean }[]
  >([]);
  const [journalSearch, setJournalSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [journalSaveError, setJournalSaveError] = useState<string | null>(null);
  const [journalIsPrivate, setJournalIsPrivate] = useState(true);

  // Habits
  const [habits, setHabits] = useState<
    { id: string; title: string; completedToday: boolean; completedCount: number; quantity: number; category: string; areaCategory: string; frequency: "daily" | "weekly" }[]
  >([]);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [habitPercentage, setHabitPercentage] = useState(0);
  const [prayerLogsMap, setPrayerLogsMap] = useState<Record<string, boolean>>({});
  const [trialQuranRead, setTrialQuranRead] = useState(false);
  const [trialHadithRead, setTrialHadithRead] = useState(false);
  const [habitSaveError, setHabitSaveError] = useState<string | null>(null);
  const habitWrites = useRef(new Set<string>());
  const [savingHabits, setSavingHabits] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [nextStep, setNextStep] = useState<{ href: string; label: string; description: string } | null>(null);
  const [habitTab, setHabitTab] = useState<"daily" | "weekly">("daily");
  const [activeWidget, setActiveWidget] = useState<DashboardWidget>("prayer");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("widget");
    const widget = DASHBOARD_WIDGETS.find(item => item.id === requested);
    if (widget) setActiveWidget(widget.id);
  }, []);

  const selectWidget = (widget: DashboardWidget) => {
    setActiveWidget(widget);
    const url = new URL(window.location.href);
    url.searchParams.set("widget", widget);
    window.history.replaceState(null, "", url);
  };

  const widgetPanelClass = (widget: DashboardWidget) =>
    activeWidget === widget ? "min-w-0 space-y-5 lg:mb-5 lg:break-inside-avoid" : "hidden min-w-0 space-y-5 lg:mb-5 lg:break-inside-avoid lg:block";


  // Modals
  const [todayTasksModalOpen, setTodayTasksModalOpen] = useState(false);
  const [spiritualActivitiesOpen, setSpiritualActivitiesOpen] = useState(false);
  const [consistencyModalOpen, setConsistencyModalOpen] = useState(false);

  // Dedicated Analytics Modals
  const [sholatAnalyticsOpen, setSholatAnalyticsOpen] = useState(false);
  const [quranAnalyticsOpen, setQuranAnalyticsOpen] = useState(false);
  const [hadithAnalyticsOpen, setHadithAnalyticsOpen] = useState(false);

  // Sholat analytics data (fetched on modal open)
  const [sholatAnalytics, setSholatAnalytics] = useState<{
    wajibDays: number; sunnahCount: number; streak: number; totalDays: number;
  } | null>(null);

  // Quran analytics data
  const [quranAnalytics, setQuranAnalytics] = useState<{
    totalDays: number; totalAyat: number; streak: number;
  } | null>(null);

  // Hadith analytics data
  const [hadithAnalytics, setHadithAnalytics] = useState<{
    totalRead: number; streak: number;
  } | null>(null);

  // Real stats
  const [accountCreatedDate, setAccountCreatedDate] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [safarRemindedToday, setSafarRemindedToday] = useState(false);
  const [safarPartnerName, setSafarPartnerName] = useState<string | null>(null);
  const [safarRemindLoading, setSafarRemindLoading] = useState(false);
  const [safarRemindError, setSafarRemindError] = useState<string | null>(null);
  const [areaChartData, setAreaChartData] = useState<{ day: string; avg: number | null }[]>([]);

  // Welcome modal
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [welcomeNotificationId, setWelcomeNotificationId] = useState<string | null>(null);

  // Fetch sholat analytics data when modal opens
  useEffect(() => {
    if (!sholatAnalyticsOpen || !userId) return;
    (async () => {
      try {
        const supabase = createClient();
        const dates = getLocalDateRange(7, userTimeZone).map(day => day.dateStr);
        const { data: logs } = await supabase
          .from("prayer_logs")
          .select("date, prayer_name, is_completed")
          .eq("user_id", userId)
          .in("date", dates)
          .eq("is_completed", true);

        const WAJIB = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];
        let wajibDays = 0;
        let sunnahCount = 0;
        let streak = 0;

        for (const date of dates) {
          const dayLogs = (logs || []).filter((r: any) => r.date === date);
          const wajibDone = WAJIB.filter((w) => dayLogs.some((r: any) => r.prayer_name === w)).length;
          if (wajibDone === 5) wajibDays++;
          sunnahCount += dayLogs.filter((r: any) => !WAJIB.includes(r.prayer_name)).length;
        }

        // Calculate streak (consecutive days with all 5 wajib from today backwards)
        for (let i = dates.length - 1; i >= 0; i--) {
          const dayLogs = (logs || []).filter((r: any) => r.date === dates[i]);
          const wajibDone = WAJIB.filter((w) => dayLogs.some((r: any) => r.prayer_name === w)).length;
          if (wajibDone === 5) streak++;
          else break;
        }

        setSholatAnalytics({ wajibDays, sunnahCount, streak, totalDays: 7 });
      } catch {
        setSholatAnalytics({ wajibDays: 0, sunnahCount: 0, streak: 0, totalDays: 7 });
      }
    })();
  }, [sholatAnalyticsOpen, userId, userTimeZone]);

  // Fetch quran analytics data when modal opens
  useEffect(() => {
    if (!quranAnalyticsOpen || !userId) return;
    (async () => {
      try {
        const supabase = createClient();
        const dates = getLocalDateRange(7, userTimeZone).map(day => day.dateStr);
        const { data: logs } = await supabase
          .from("quran_logs")
          .select("date, total_ayat")
          .eq("user_id", userId)
          .in("date", dates);

        const dayMap = new Map<string, number>();
        (logs || []).forEach((r: any) => {
          dayMap.set(r.date, (dayMap.get(r.date) || 0) + (Number(r.total_ayat) || 0));
        });

        const totalDays = dayMap.size;
        let totalAyat = 0;
        dayMap.forEach((v) => { totalAyat += v; });

        let streak = 0;
        for (let i = dates.length - 1; i >= 0; i--) {
          if (dayMap.has(dates[i])) streak++;
          else break;
        }

        setQuranAnalytics({ totalDays, totalAyat, streak });
      } catch {
        setQuranAnalytics({ totalDays: 0, totalAyat: 0, streak: 0 });
      }
    })();
  }, [quranAnalyticsOpen, userId, userTimeZone]);

  // Fetch hadith analytics data when modal opens
  useEffect(() => {
    if (!hadithAnalyticsOpen || !userId) return;
    (async () => {
      try {
        const supabase = createClient();
        const dates = getLocalDateRange(7, userTimeZone).map(day => day.dateStr);
        const { data: logs } = await supabase
          .from("hadith_logs")
          .select("date, is_read")
          .eq("user_id", userId)
          .in("date", dates)
          .eq("is_read", true);

        const readDates = new Set((logs || []).map((r: any) => r.date));
        let streak = 0;
        for (let i = dates.length - 1; i >= 0; i--) {
          if (readDates.has(dates[i])) streak++;
          else break;
        }

        setHadithAnalytics({ totalRead: readDates.size, streak });
      } catch {
        setHadithAnalytics({ totalRead: 0, streak: 0 });
      }
    })();
  }, [hadithAnalyticsOpen, userId, userTimeZone]);

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
          const resolvedTimeZone = resolveParticipantTimeZone(profile.timezone, profile.timezone_mode || "AUTO");
          setUserTimeZone(resolvedTimeZone);
          if ((profile.timezone_mode || "AUTO") === "AUTO" && profile.timezone !== resolvedTimeZone) {
            const { error: timeZoneUpdateError } = await supabase
              .from("profiles")
              .update({ timezone: resolvedTimeZone })
              .eq("user_id", user.id);
            if (timeZoneUpdateError) console.error("Gagal memperbarui timezone perjalanan:", timeZoneUpdateError);
          }
          setSafarPartnerName(profile.sahabat_safar_user_id ? profile.sahabat_safar_name || "Sahabat Safar" : null);
          const profileTimeZone = resolveParticipantTimeZone(profile.timezone, profile.timezone_mode || "AUTO");
          const cDate = profile.created_at ? getLocalDateString(new Date(profile.created_at), profileTimeZone) : getLocalDateString(new Date(), profileTimeZone);
          setAccountCreatedDate(cDate);
        } else {
          setAccountCreatedDate(getLocalDateString(new Date(), DEFAULT_TIME_ZONE));
        }

        // Check if reminded safar today
        const safarTodayStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        const { data: safarData, error: safarError } = await supabase
            .from("safar_reminders")
            .select("id")
            .eq("user_id", user.id)
            .eq("date", safarTodayStr)
            .limit(1)
            .maybeSingle();
        if (safarError) console.error("Gagal memuat status pengingat Sahabat Safar:", safarError);
        if (safarData) setSafarRemindedToday(true);

        // 2. Journey
        const { data: journey, error: journeyError } = await supabase
          .from("journeys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (journeyError) throw journeyError;

        const [{ data: preparation }, { data: baseline }] = await Promise.all([
          supabase.from("sahabat_safar_profiles").select("is_completed").eq("user_id", user.id).maybeSingle(),
          supabase.from("baseline_assessments").select("completed").eq("user_id", user.id).eq("completed", true).limit(1).maybeSingle(),
        ]);
        setNextStep(!preparation?.is_completed
          ? { href: "/initial-process", label: "Lengkapi persiapan perjalanan", description: isTrial ? "Kenali kebutuhan dan siapkan waktu untuk latihan spiritual Anda." : "Ceritakan kebutuhan Anda agar pendampingan dan Sahabat Safar lebih sesuai." }
          : !baseline?.completed
          ? { href: "/baseline", label: "Kenali kondisi awal Anda", description: "Isi refleksi awal untuk membantu memilih fokus perubahan." }
          : !journey?.ptp_published_at
          ? { href: "/journey", label: "Susun rencana perubahan", description: "Pilih fokus, tentukan target, lalu terapkan rencana kebiasaan Anda." }
          : null);

        if (journey || profile?.start_date) {
          const startDateVal = profile?.start_date || journey?.start_date || journey?.created_at;
          if (startDateVal) {
            const currentDay = Math.min(totalDays, getProgramDay(startDateVal, new Date(), resolveParticipantTimeZone(profile?.timezone, profile?.timezone_mode || "AUTO")));
            setDayCount(trialAccess ? getTrialProgress(trialAccess).day : currentDay);
          }
        }

        // 3. Habits: Query habits table + action_plans, ensuring valid habits.id FK
        const profileTimeZone = resolveParticipantTimeZone(profile?.timezone, profile?.timezone_mode || "AUTO");
        const todayStr = getLocalDateString(new Date(), profileTimeZone);
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

            const canonicalFrequency = normalizeHabitFrequency(ap.frequency || match?.frequency);
            if (match && (!match.action_plan_id || !match.area_category || normalizeHabitFrequency(match.frequency) !== canonicalFrequency)) {
              const { data: linked, error: linkError } = await supabase.from("habits").update({
                action_plan_id: ap.id,
                area_category: ap.area_category || ap.category || "Spiritual Growth",
                quantity: ap.quantity || ap.target || match.quantity || match.target || 1,
                frequency: canonicalFrequency,
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
                    frequency: normalizeHabitFrequency(ap.frequency),
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
              frequency: canonicalFrequency,
              area_category: ap.area_category || ap.category || (match ? (match.area_category || match.category) : null) || "Spiritual Growth",
              is_archived: match?.is_archived,
              frequency_kind: match?.frequency_kind,
              custom_schedule: match?.custom_schedule,
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
              frequency: normalizeHabitFrequency(h.frequency),
              area_category: h.area_category || h.category || "Spiritual Growth",
              is_archived: h.is_archived,
              frequency_kind: h.frequency_kind,
              custom_schedule: h.custom_schedule,
              effective_from: h.effective_from || null,
              effective_until: h.effective_until || null,
            };
          }
        });

        userHabits = Object.values(habitMap);

        const { data: settings } = await supabase.from("settings").select("journal_privacy_default").eq("user_id", user.id).maybeSingle();
        setJournalIsPrivate(settings?.journal_privacy_default ?? true);


        // Filter habits active today
        const activeTodayHabits = (userHabits || []).filter((h: any) => {
          if (h.is_archived === true) return false;
          if (h.effective_from && h.effective_from > todayStr) return false;
          if (h.effective_until && h.effective_until < todayStr) return false;
          return true;
        });

        // Load today's completed status from tracker tables
        const weeklyOccurrenceKey = getHabitOccurrenceKey("weekly", new Date(), profileTimeZone);
        const [prayerLogsRes, quranLogsRes, hadithLogsRes] = await Promise.all([
          supabase.from("prayer_logs").select("date, prayer_name, is_completed").eq("user_id", user.id).gte("date", weeklyOccurrenceKey).lte("date", todayStr).eq("is_completed", true),
          supabase.from("quran_logs").select("id, date").eq("user_id", user.id).gte("date", weeklyOccurrenceKey).lte("date", todayStr),
          supabase.from("hadith_logs").select("date, is_read").eq("user_id", user.id).gte("date", weeklyOccurrenceKey).lte("date", todayStr).eq("is_read", true),
        ]);

        const completedPrayerKeys = new Set((prayerLogsRes.data || []).filter((r: any) => r.date === todayStr).map((r: any) => r.prayer_name));
        const hasQuranToday = (quranLogsRes.data || []).some((r: any) => r.date === todayStr);
        const hasHadithToday = (hadithLogsRes.data || []).some((r: any) => r.date === todayStr && r.is_read === true);
        setTrialQuranRead(hasQuranToday);
        setTrialHadithRead(hasHadithToday);

        // Build initial prayerLogsMap for today
        const pMap: Record<string, boolean> = {};
        (prayerLogsRes.data || []).forEach((r: any) => {
          pMap[`${r.date}_${r.prayer_name}`] = true;
        });
        setPrayerLogsMap(pMap);

        let habitList: { id: string; title: string; completedToday: boolean; completedCount: number; quantity: number; category: string; areaCategory: string; frequency: "daily" | "weekly" }[] = [];

        // Weekly habits have one occurrence, keyed by the participant's local Monday.
        const { data: habitLogsToday } = await supabase
          .from("habit_logs")
          .select("habit_id, completed, completed_count")
          .eq("user_id", user.id)
          .in("date", [todayStr, weeklyOccurrenceKey]);

        const habitLogCountMap: Record<string, number> = {};
        (habitLogsToday || []).forEach((hl: any) => {
          habitLogCountMap[hl.habit_id] = hl.completed_count || (hl.completed ? 1 : 0);
        });

        if (activeTodayHabits.length > 0) {
          habitList = activeTodayHabits.map((h: any) => {
            const cat = detectHabitCategory(h.title);
            const qty = h.quantity || 1;
            let completedCount = habitLogCountMap[h.id] || 0;
            let completedToday = false;

            if (h.frequency === "weekly") {
              if (cat === "prayer") {
                const key = getPrayerKeyFromHabitTitle(h.title);
                if (key) completedCount = Math.max(completedCount, (prayerLogsRes.data || []).filter((row: any) => row.prayer_name === key).length);
              } else if (cat === "quran") {
                completedCount = Math.max(completedCount, (quranLogsRes.data || []).length);
              } else if (cat === "hadith") {
                completedCount = Math.max(completedCount, (hadithLogsRes.data || []).length);
              }
              completedCount = Math.min(qty, completedCount);
              completedToday = completedCount >= qty;
            } else if (cat === "prayer") {
              const key = getPrayerKeyFromHabitTitle(h.title);
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
              frequency: h.frequency,
            };
          });
        }

        setHabits(habitList);
        // Proportional scoring: each habit contributes completedCount/quantity
        const dailyHabits = habitList.filter(habit => habit.frequency === "daily");
        const totalScore = dailyHabits.reduce((acc, h) => acc + Math.min(1, h.completedCount / h.quantity), 0);
        const done = dailyHabits.filter((h) => h.completedToday).length;
        setCompletedTodayCount(done);
        setHabitPercentage(
          dailyHabits.length > 0 ? Math.round((totalScore / dailyHabits.length) * 100) : 0
        );

        // Use the same scheduled-occurrence calculation as Monitoring and the impact report.
        const areas = (Array.isArray(journey?.area_transformasi) ? journey.area_transformasi : []).map(normalizeTransformationArea);
        const start = profile?.start_date || journey?.created_at;
        if (areas.length && start) {
          const startDate = getLocalDateString(new Date(start), profileTimeZone);
          const { data: logs, error } = await supabase.from("habit_logs").select("habit_id,date,activity_date,completed,completed_count")
            .eq("user_id",user.id).eq("is_canonical_occurrence",true).gte("date",getHabitOccurrenceKey("weekly",new Date(`${startDate}T12:00:00Z`),"UTC")).lte("date",todayStr);
          if (error) throw error;
          const execution = calculateExecution({ startDate,endDate:todayStr,areas,
            habits: userHabits.filter(h => !h.is_archived).map(h => ({ id:h.id,area:normalizeTransformationArea(h.area_category),quantity:h.quantity,
              frequency:h.frequency_kind || h.frequency,weekdays:h.custom_schedule?.weekdays,effectiveFrom:h.effective_from,effectiveUntil:h.effective_until })), logs:logs || [] });
          setAreaChartData(execution.timeline.map(point => ({day:point.date,avg:point.score})));
        }

        // 4. Load All Journals & Last Journal
        const { data: journalsData, error: journalsError } = await supabase
          .from("journals")
          .select("id, date, content, is_private")
          .eq("user_id", user.id)
          .not("content", "is", null)
          .order("created_at", { ascending: false });
        if (journalsError) throw journalsError;

        if (journalsData && journalsData.length > 0) {
          setUserJournals(
            journalsData.map((j) => {
              const parsed = parseJournalContent(j.content);
              return {
                id: j.id || j.date,
                date: getCanonicalJournalDate(j.date),
                reflection: parsed.reflection,
                lesson: parsed.lesson,
                improvement: parsed.improvement,
                isPrivate: j.is_private ?? true,
              };
            })
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
  }, [supabase, refresh, trialAccess, isTrial, totalDays]);

  // Welcome modal: check for unread welcome notification → show after 3 seconds
  useEffect(() => {
    if (!userId) return;
    let timeout: ReturnType<typeof setTimeout>;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message")
        .eq("user_id", user.id)
        .eq("category", "welcome")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setWelcomeNotificationId(data.id);
        timeout = setTimeout(() => setWelcomeModalOpen(true), 3000);
      }
    })();
    return () => clearTimeout(timeout);
  }, [userId, supabase]);

  // Welcome modal handlers
  const handleDismissWelcome = async () => {
    if (welcomeNotificationId) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", welcomeNotificationId);
    }
    setWelcomeModalOpen(false);
    setWelcomeNotificationId(null);
  };

  const handleWelcomeCTA = async () => {
    if (welcomeNotificationId) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", welcomeNotificationId);
    }
    setWelcomeModalOpen(false);
    setWelcomeNotificationId(null);
    router.push("/initial-process");
  };

  const updateHabitSummary = (updated: typeof habits) => {
    const dailyHabits = updated.filter(habit => habit.frequency === "daily");
    const totalScore = dailyHabits.reduce((sum, habit) => sum + Math.min(1, habit.completedCount / habit.quantity), 0);
    setCompletedTodayCount(dailyHabits.filter((habit) => habit.completedToday).length);
    setHabitPercentage(dailyHabits.length > 0 ? Math.round((totalScore / dailyHabits.length) * 100) : 0);
  };

  const syncTrackerHabits = async (category: "prayer" | "quran", prayerName?: string, delta = 1, activityDate = getLocalDateString(new Date(), userTimeZone)) => {
    const candidates = habits.filter((habit) => {
      if (habit.category !== category) return false;
      return category !== "prayer" || getPrayerKeyFromHabitTitle(habit.title) === prayerName;
    });
    const progress = new Map<string, { completedCount: number; completedToday: boolean }>();
    for (const target of candidates) {
      const frequency = normalizeHabitFrequency(target.frequency);
      const occurrenceDate = new Date(`${activityDate}T12:00:00Z`);
      const occurrenceKey = getHabitOccurrenceKey(frequency, occurrenceDate, userTimeZone);
      const { data: existing } = await supabase.from("habit_logs").select("id,completed_count").eq("user_id", userId).eq("habit_id", target.id).eq("date", occurrenceKey).maybeSingle();
      const storedCount = Number(existing?.completed_count) || 0;
      const nextCount = frequency === "weekly"
        ? Math.max(0, Math.min(target.quantity, storedCount + delta))
        : delta > 0 ? target.quantity : 0;
      const nextCompleted = nextCount >= target.quantity;
      const result = existing
        ? nextCount > 0
          ? await supabase.from("habit_logs").update({ completed: nextCompleted, completed_count: nextCount, activity_date: activityDate }).eq("id", existing.id)
          : await supabase.from("habit_logs").delete().eq("id", existing.id)
        : nextCount > 0
          ? await supabase.from("habit_logs").insert({ user_id: userId, habit_id: target.id, date: occurrenceKey, activity_date: activityDate, completed: nextCompleted, completed_count: nextCount })
          : { error: null };
      if (result.error) throw result.error;
      const currentOccurrenceKey = getHabitOccurrenceKey(frequency, new Date(), userTimeZone);
      if (occurrenceKey === currentOccurrenceKey) {
        progress.set(target.id, { completedCount: nextCount, completedToday: nextCompleted });
      }
    }

    if (progress.size > 0) {
      setHabits((current) => {
        const updated = current.map((habit) => progress.has(habit.id) ? { ...habit, ...progress.get(habit.id)! } : habit);
        updateHabitSummary(updated);
        return updated;
      });
    }
  };

  // Realtime handler when prayer is toggled in PrayerTracker
  const handlePrayerToggleFromTracker = (dateStr: string, prayerName: string, isCompleted: boolean) => {
    setPrayerLogsMap((prev) => ({ ...prev, [`${dateStr}_${prayerName}`]: isCompleted }));

    const todayStr = getLocalDateString(new Date(), userTimeZone);
    if (dateStr === todayStr) {
      setHabits((prevHabits) => {
        const updated = prevHabits.map((h) => {
          const cat = detectHabitCategory(h.title);
          if (cat === "prayer" && h.frequency === "daily") {
            const pKey = getPrayerKeyFromHabitTitle(h.title);
            if (pKey === prayerName) {
              return { ...h, completedToday: isCompleted, completedCount: isCompleted ? h.quantity : 0 };
            }
          }
          return h;
        });

        updateHabitSummary(updated);
        return updated;
      });
    }
    void syncTrackerHabits("prayer", prayerName, isCompleted ? 1 : -1, dateStr).catch((error) => {
      console.error("Gagal menyinkronkan tracker ke habit mingguan:", error);
      setHabitSaveError("Progress habit mingguan belum tersimpan.");
    });
  };

  // Realtime handler when quran is logged in QuranTracker
  const handleQuranLoggedFromTracker = () => {
    setTrialQuranRead(true);
    setHabits((prevHabits) => {
      const updated = prevHabits.map((h) => {
        const cat = detectHabitCategory(h.title);
         if (cat === "quran" && h.frequency === "daily") {
           return { ...h, completedToday: true, completedCount: h.quantity };
        }
        return h;
      });

       updateHabitSummary(updated);
       return updated;
     });
    void syncTrackerHabits("quran", undefined, 1).catch((error) => {
      console.error("Gagal menyinkronkan tracker ke habit mingguan:", error);
      setHabitSaveError("Progress habit mingguan belum tersimpan.");
    });
  };

  // Toggle habit check state — saves to the correct tracker table with realtime sync
  const toggleHabitToday = async (habitId: string) => {
    const todayStr = getLocalDateString(new Date(), userTimeZone);
    const target = habits.find((h) => h.id === habitId);
    if (!target || habitWrites.current.size > 0) return;
    habitWrites.current.add(habitId);
    setSavingHabits([habitId]);
    const occurrenceKey = getHabitOccurrenceKey(target.frequency, new Date(), userTimeZone);
    setHabitSaveError(null);

    const prayerKey = target.category === "prayer" ? getPrayerKeyFromHabitTitle(target.title) : null;
    const prayerDoneToday = prayerKey ? Boolean(prayerLogsMap[`${todayStr}_${prayerKey}`]) : false;
    const newCount = target.frequency === "weekly"
      ? Math.max(0, Math.min(target.quantity, target.completedCount + (prayerKey ? (prayerDoneToday ? -1 : 1) : target.completedToday ? -target.quantity : target.quantity)))
      : target.completedToday ? 0 : target.quantity;
    const newCompleted = newCount >= target.quantity;
    const updated = habits.map((h) =>
      h.id === habitId ? { ...h, completedToday: newCompleted, completedCount: newCount } : h
    );
    setHabits(updated);

    updateHabitSummary(updated);

    try {
      const cat = target.category;

      // Record to specific tracker tables for specialized widgets
      if (cat === "prayer") {
        if (prayerKey) {
          const nextPrayerDone = target.frequency === "weekly" ? !prayerDoneToday : newCompleted;
          setPrayerLogsMap((prev) => ({ ...prev, [`${todayStr}_${prayerKey}`]: nextPrayerDone }));
          if (nextPrayerDone) {
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
      } else if (target.frequency === "daily" && cat === "quran") {
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
      } else if (target.frequency === "daily" && cat === "hadith") {
        const { error } = await supabase.from("hadith_logs").upsert(
          { user_id: userId, date: todayStr, is_read: newCompleted },
          { onConflict: "user_id,date" }
        );
        if (error) throw error;
      }

      // Record to habit_logs using select + insert/update/delete pattern (compatible with or without UNIQUE constraint)
      const { data: existingHL } = await supabase
        .from("habit_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("habit_id", habitId)
         .eq("date", occurrenceKey)
        .maybeSingle();

      if (existingHL) {
        if (newCompleted || newCount > 0) {
          const { error } = await supabase.from("habit_logs").update({ completed: newCompleted, completed_count: newCount, activity_date: todayStr }).eq("id", existingHL.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("habit_logs").delete().eq("id", existingHL.id);
          if (error) throw error;
        }
      } else if (newCompleted || newCount > 0) {
        const { error } = await supabase.from("habit_logs").insert({
          user_id: userId,
          habit_id: habitId,
           date: occurrenceKey,
          activity_date: todayStr,
          completed: newCompleted,
          completed_count: newCount,
        });
        if (error) throw error;
      }
      setRefresh(value => value + 1);
    } catch (err) {
      console.error("Gagal menyimpan checklist habit:", err);
      setHabitSaveError("Checklist gagal disimpan. Periksa koneksi lalu coba lagi.");
      setHabits(habits);
      updateHabitSummary(habits);
    } finally {
      habitWrites.current.delete(habitId);
      setSavingHabits([]);
    }
  };

  // Increment one sub-step for habits with quantity > 1
  const incrementHabitCount = async (habitId: string) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target || target.category !== 'general') return;
    const occurrenceKey = getHabitOccurrenceKey(target.frequency, new Date(), userTimeZone);
    const activityDate = getLocalDateString(new Date(), userTimeZone);
    setHabitSaveError(null);

    const newCount = Math.min(target.quantity, (target.completedCount || 0) + 1);
    const newCompleted = newCount >= target.quantity;

    const updated = habits.map((h) =>
      h.id === habitId ? { ...h, completedCount: newCount, completedToday: newCompleted } : h
    );
    setHabits(updated);

    updateHabitSummary(updated);

    try {
      const { data: existingHL } = await supabase
        .from("habit_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("habit_id", habitId)
         .eq("date", occurrenceKey)
        .maybeSingle();

      if (existingHL) {
        const { error } = await supabase.from("habit_logs").update({ completed: newCompleted, completed_count: newCount, activity_date: activityDate }).eq("id", existingHL.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_logs").insert({
          user_id: userId,
          habit_id: habitId,
           date: occurrenceKey,
          activity_date: activityDate,
          completed: newCompleted,
          completed_count: newCount,
        });
        if (error) throw error;
      }
      setRefresh(value => value + 1);
    } catch (err) {
      console.error("Gagal simpan sub-step:", err);
      setHabitSaveError("Progress habit gagal disimpan. Periksa koneksi lalu coba lagi.");
      setHabits(habits);
      updateHabitSummary(habits);
    } finally {
      habitWrites.current.delete(habitId);
      setSavingHabits([]);
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

  const openQuickJournal = () => {
    const todayStr = getLocalDateString(new Date(), userTimeZone);
    const existing = userJournals.find((journal) => getCanonicalJournalDate(journal.date) === todayStr);
    setJournalContent(existing?.reflection || "");
    if (existing) setJournalIsPrivate(existing.isPrivate);
    setWriteJournalOpen(true);
  };

  const handleRemindSafar = async () => {
    if (!userId || !safarPartnerName || safarRemindedToday || safarRemindLoading) return;
    setSafarRemindLoading(true);
    setSafarRemindError(null);
    try {
      const { data, error } = await supabase.rpc("remind_sahabat_safar");
      if (error) throw error;
      if (data?.sent || data?.already_sent) setSafarRemindedToday(true);
    } catch (err) {
      console.error("Gagal mengingatkan Sahabat Safar:", err);
      const message = err instanceof Error ? err.message : "Pengingat belum dapat dikirim.";
      setSafarRemindError(
        message.includes("belum ditetapkan") || message.includes("belum sinkron")
          ? message
          : "Pengingat belum dapat dikirim. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setSafarRemindLoading(false);
    }
  };

  // Save new reflection journal
  const handleSaveJournal = async () => {
    if (!journalContent.trim() || !userId) return;
    const todayStr = getLocalDateString(new Date(), userTimeZone);
    setJournalSaveError(null);

    try {
      const existingJournal = userJournals.find(journal => getCanonicalJournalDate(journal.date) === todayStr);
      const journalPayload = {
        content: composeJournalContent(journalContent, existingJournal?.lesson || "", existingJournal?.improvement || ""),
        is_private: existingJournal ? existingJournal.isPrivate : journalIsPrivate,
      };
      const saveQuery = existingJournal
        ? supabase.from("journals").update(journalPayload).eq("id", existingJournal.id)
        : supabase.from("journals").insert({ user_id: userId, date: todayStr, ...journalPayload });
      const { data: savedJournal, error } = await saveQuery.select("id").single();
      if (error) throw error;

      setJournalLast(journalContent.trim());
      setJournalLastDate(
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );

      // Add to list
      const newItem = {
          id: savedJournal?.id || todayStr,
        date: todayStr,
          reflection: journalContent.trim(),
          lesson: existingJournal?.lesson || "",
          improvement: existingJournal?.improvement || "",
          isPrivate: journalPayload.is_private,
      };
      setUserJournals((prev) => [
        newItem,
        ...prev.filter((j) => j.date !== todayStr),
      ]);

      setJournalContent("");
      setWriteJournalOpen(false);
    } catch (e) {
      console.error("Gagal simpan jurnal:", e);
      setJournalSaveError("Refleksi belum tersimpan. Periksa koneksi lalu coba lagi.");
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
  const journalPreview = parseJournalContent(journalLast).reflection;
  const dailyHabits = habits.filter(habit => habit.frequency === "daily");
  const weeklyHabits = habits.filter(habit => habit.frequency === "weekly");
  const completedWeeklyUnits = weeklyHabits.reduce((total, habit) => total + Math.min(habit.quantity, habit.completedCount), 0);
  const totalWeeklyUnits = weeklyHabits.reduce((total, habit) => total + habit.quantity, 0);
  const visibleHabits = habitTab === "daily" ? dailyHabits : weeklyHabits;
  const trialDate = getLocalDateString(new Date(), userTimeZone);
  const prayerCount = ["subuh", "dzuhur", "ashar", "maghrib", "isya"].filter(prayer => prayerLogsMap[trialDate + "_" + prayer]).length;
  const trialActivities = [
    { label: "Salat wajib", detail: prayerCount + "/5 salat", done: prayerCount === 5 },
    { label: "Tilawah Al-Qur’an", done: trialQuranRead },
    { label: "Membaca hadits", done: trialHadithRead },
    { label: "Refleksi harian", done: userJournals.some(journal => journal.date === trialDate && Boolean(journal.reflection || journal.lesson || journal.improvement)) },
  ];
  const summaryCompleted = isTrial ? trialActivities.filter(activity => activity.done).length : completedTodayCount;
  const summaryTotal = isTrial ? trialActivities.length : dailyHabits.length;


  return (
    <ParticipantLayout activePath={isTrial ? "/trial" : "/dashboard"}>
      <div className="space-y-7 max-w-6xl w-full mx-auto pb-10 md:pb-0">
        {/* ─── UNIFIED 16:9 HERO BANNER ─── */}
        <AdaptiveJourneyHero
          name={userName}
          location={userLocation}
          timeZone={userTimeZone}
          day={dayCount}
          totalDays={totalDays}
          actions={!isTrial &&
                <button
                  type="button"
                  onClick={handleRemindSafar}
                  disabled={!safarPartnerName || safarRemindedToday || safarRemindLoading}
                  aria-label="Ingatkan Sahabat Safar" title={safarRemindedToday ? "Pengingat sudah terkirim" : safarPartnerName ? `Kirim pengingat kepada ${safarPartnerName}` : "Sahabat Safar belum ditetapkan"}
                  className={`inline-flex items-center justify-center h-11 w-11 rounded-full transition-colors ${
                    safarRemindedToday
                      ? "bg-emerald-500/90 text-white border border-emerald-300"
                      : !safarPartnerName
                        ? "bg-white/10 text-white/50 border border-white/15 cursor-not-allowed"
                      : "bg-white/20 hover:bg-white/30 text-amber-200 border border-white/30 backdrop-blur-md"
                  } disabled:cursor-not-allowed`}
                >
                  {safarRemindLoading ? (
                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : safarRemindedToday ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                </button>
          }
          notice={
              safarRemindError && (
                <p
                  role="alert"
                  className="max-w-md rounded-md border border-rose-300/30 bg-rose-950/70 px-2.5 py-1.5 text-xs font-semibold text-rose-100"
                >
                  {safarRemindError}
                </p>
              )
          }
          summary={
            <div className="bg-black/35 px-3 py-3 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/15 backdrop-blur-md shrink-0 w-[116px] sm:w-40 lg:w-auto lg:min-w-[200px] lg:max-w-xs shadow-md">
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="whitespace-nowrap text-base font-semibold leading-tight tabular-nums text-white sm:text-xl">
                    {summaryCompleted}/{summaryTotal}
                  </p>
                  <p className="mt-0.5 text-xs font-medium leading-tight text-slate-200">harian</p>
                </div>
                <button
                  type="button"
                  onClick={() => isTrial ? setSpiritualActivitiesOpen(true) : setTodayTasksModalOpen(true)}
                  className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                  aria-label="Lihat aktivitas harian"
                >
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </button>
              </div>

              {/* Area Progress Line Graph */}
              <div className="h-10 sm:h-14 w-full mt-2">
                {isTrial ? (
                  <div role="img" aria-label={summaryCompleted + " dari 4 aktivitas spiritual tercatat hari ini"} className="grid h-full grid-cols-4 items-end gap-1 py-2">
                    {trialActivities.map(activity => <span key={activity.label} aria-hidden="true" className={activity.done ? "h-full rounded-sm bg-amber-300" : "h-1 rounded-sm bg-white/35"} />)}
                  </div>
                ) : <AreaProgressGraph data={areaChartData} className="w-full h-full" />}
              </div>
            </div>
          }
        />

        {isTrial && trialProgress && (
          <div className="hidden flex-wrap items-center justify-between gap-2 text-sm text-slate-600 lg:flex">
            <p>Uji coba Spiritual Growth · {trialProgress.remainingDays} hari tersisa</p>
            <Link href="/panduan" className="inline-flex min-h-11 items-center gap-2 font-medium text-navy-900 underline underline-offset-4">Panduan <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        )}

        {nextStep && (
          <section aria-label="Langkah berikutnya" className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-navy-900 sm:text-base">{nextStep.label}</h2>
              <p className="mt-1 hidden max-w-xl text-sm leading-6 text-slate-700 sm:block">{nextStep.description}</p>
            </div>
            <Link href={nextStep.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white">Lanjutkan <ArrowRight aria-hidden className="size-4" /></Link>
          </section>
        )}

        <DashboardShortcuts value={activeWidget} onChange={selectWidget} />

        <div className="grid grid-cols-1 items-start gap-5 lg:block lg:columns-2 xl:columns-3">
          <section id="dashboard-prayer" aria-label="Salat" className={widgetPanelClass("prayer")}>
            <PrayerTimesWidget
            location={userLocation}
            timeZone={userTimeZone}
          />
            <PrayerTracker
              userId={userId}
              accountCreatedDate={accountCreatedDate}
              timeZone={userTimeZone}
              externalLogs={prayerLogsMap}
              onPrayerToggle={handlePrayerToggleFromTracker}
              headerAction={
                <Button type="button" variant="ghost" size="icon" onClick={() => setSholatAnalyticsOpen(true)} aria-label="Lihat ringkasan catatan salat" className="size-11 shrink-0 text-slate-600">
                  <Maximize2 className="size-4" aria-hidden="true" />
                </Button>
              }
            />
          </section>
          <section id="dashboard-habits" aria-label="Habit PTP" className={widgetPanelClass("habits")}>
            <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="font-extrabold text-navy-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  Habit PTP
                </h3>
              </div>

              {habits.length === 0 ? (
                <div className="py-8 text-center space-y-3 border border-dashed border-warm-border rounded-xl p-4 bg-warm-bg/40">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
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
                  <Tabs value={habitTab} onValueChange={value => setHabitTab(value as "daily" | "weekly")}>
                    <TabsList className="grid h-9 w-full grid-cols-2 border-0 bg-slate-100 p-1">
                      <TabsTrigger value="daily" className="h-7 border-0 text-xs shadow-none data-[state=active]:border-0">Harian · {dailyHabits.length}</TabsTrigger>
                      <TabsTrigger value="weekly" className="h-7 border-0 text-xs shadow-none data-[state=active]:border-0">Pekanan · {weeklyHabits.length}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="mt-3">
                      <div className="rounded-xl bg-amber-50/70 p-3">
                        <span className="text-xs font-bold text-navy-900">{completedTodayCount}/{dailyHabits.length} habit selesai hari ini</span>
                        <Progress value={habitPercentage} className="mt-2 h-1.5 bg-amber-100" />
                      </div>
                    </TabsContent>
                    <TabsContent value="weekly" className="mt-3">
                      <div className="rounded-xl bg-amber-50/70 p-3">
                        <span className="text-xs font-bold text-navy-900">{completedWeeklyUnits}/{totalWeeklyUnits} pelaksanaan minggu ini</span>
                        <p className="mt-1 text-xs text-slate-600">Periode Senin-Minggu. Tidak wajib selesai pada hari tertentu.</p>
                        <Progress value={totalWeeklyUnits > 0 ? Math.round(completedWeeklyUnits / totalWeeklyUnits * 100) : 0} className="mt-2 h-1.5 bg-amber-100" />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {habitSaveError && (
                    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      {habitSaveError}
                    </div>
                  )}

                  {/* Habit Checklist Preview — supports quantity sub-step counter */}
                  <div className="space-y-1.5 pt-1">
                    {visibleHabits.slice(0, 4).map((h) => {
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
                          {h.frequency === "weekly" ? (
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.completedToday ? "bg-emerald-200 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{h.completedCount}/{h.quantity} kali</span>
                              {!h.completedToday && (
                                <button onClick={() => h.category === "general" ? incrementHabitCount(h.id) : toggleHabitToday(h.id)} className="h-5 w-5 rounded-full bg-amber-500 text-white font-bold" title={`Tambah pelaksanaan (${h.completedCount + 1}/${h.quantity})`}>+</button>
                              )}
                            </div>
                          ) : isMultiStep ? (
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                h.completedToday ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-600"
                              }`}>
                                {h.completedCount}/{h.quantity}
                              </span>
                              {!h.completedToday && (
                                <button
                                  disabled={savingHabits.length>0} aria-busy={savingHabits.includes(h.id)} onClick={() => incrementHabitCount(h.id)}
                                  className="size-11 rounded-xl bg-amber-100 text-navy-900 flex items-center justify-center hover:bg-amber-500 transition-colors font-bold text-xs"
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
                              aria-label={`${h.completedToday ? "Batalkan" : "Tandai selesai"}: ${h.title}`} aria-pressed={h.completedToday} disabled={savingHabits.length>0} aria-busy={savingHabits.includes(h.id)}
                              className={`size-11 rounded-xl flex items-center justify-center shrink-0 ml-2 ${
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
                className="flex min-h-11 w-full scroll-my-28 items-center justify-between rounded-lg text-xs font-bold text-navy-900 transition-colors hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span>Lihat Detail Habit</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
          </section>
          <section id="dashboard-hadith" aria-label="Hadits" className={widgetPanelClass("hadith")}>
            <div className="relative">
            <button type="button" aria-label="Lihat ringkasan baca hadits" onClick={() => setHadithAnalyticsOpen(true)} className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-xl bg-white text-slate-600 hover:bg-slate-100"><BarChart3 aria-hidden className="size-4" /></button>
            <DailyHadithWidget userId={userId} timeZone={userTimeZone} onReadChange={isTrial ? setTrialHadithRead : undefined} />
          </div>
          </section>
          <section id="dashboard-quran" aria-label="Tilawah Al-Qur’an" className={widgetPanelClass("quran")}>
            <div className="relative">
            <button type="button" aria-label="Lihat ringkasan bacaan Al-Qur’an" onClick={() => setQuranAnalyticsOpen(true)} className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-xl bg-white text-slate-600 hover:bg-slate-100"><BarChart3 aria-hidden className="size-4" /></button>
            <QuranTracker userId={userId} timeZone={userTimeZone} onQuranLogged={handleQuranLoggedFromTracker} />
          </div>
          </section>
          <section id="dashboard-journal" aria-label="Jurnal" className={widgetPanelClass("journal")}>
            <Card className="group bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-5 transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Ruang hening</p>
                    <h3 className="mt-0.5 truncate text-sm font-extrabold text-navy-900">Journal refleksi</h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">Catat satu hal yang bermakna hari ini</p>
                  </div>
                </div>
                <Button
                  size="sm"
                   onClick={openQuickJournal}
                  className="shrink-0 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition-transform hover:bg-slate-800 active:scale-[.98]"
                >
                  Tulis
                </Button>
              </div>

              {/* Reflection Card Preview */}
              {journalLast ? (
                <div className="relative overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                      Catatan terakhir
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {journalLastDate}
                    </span>
                    {pinnedIds.includes(userJournals[0]?.id) && (
                      <Pin className="h-3.5 w-3.5 shrink-0 fill-amber-600 text-amber-700" />
                    )}
                  </div>
                  <p className="text-sm leading-6 text-navy-900 font-serif italic line-clamp-3">
                    &ldquo;{journalPreview}&rdquo;
                  </p>
                  <span className="block text-xs font-semibold text-amber-700">Buka Journal untuk membaca seluruh catatan</span>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Belum ada catatan refleksi</p>
                  <p className="mx-auto max-w-[220px] text-xs leading-relaxed text-slate-600">Mulai dari satu kalimat. Tidak perlu menunggu hari yang sempurna.</p>
                   <button type="button" onClick={openQuickJournal} className="pt-1 text-xs font-bold text-amber-700 hover:text-amber-800">
                    Tulis refleksi pertama
                  </button>
                </div>
              )}
            </div>

            {/* Clickable button to open full journal page */}
            <div className="pt-3 border-t border-warm-border/60">
              <Link href="/journal" className="w-full block">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-amber-700" />
                    Buka Halaman Journal ({userJournals.length} catatan)
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Button>
              </Link>
            </div>
          </Card>
          </section>
          <section id="dashboard-analytics" aria-label="Analitik" className={widgetPanelClass("analytics")}>
            <Card className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-warm-border/60 pb-3">
                <div>
                     <h3 className="font-extrabold text-navy-900 text-sm">
                     Periode program
                  </h3>
                   <p className="text-xs text-slate-600 font-medium mt-0.5">
                     Perjalanan {totalDays} hari yang sedang Anda jalani
                  </p>
                </div>
                 <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold text-xs">
                   {remainingDays} hari lagi
                </Badge>
              </div>

              {/* Countdown Big Display */}
               <div className="flex items-end justify-between gap-3">
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-black tracking-tight text-navy-900 tabular-nums sm:text-5xl">
                    {remainingDays}
                  </span>
                  <span className="text-xs text-slate-600 font-bold">
                     hari tersisa
                   </span>
                 </div>
                 <span className="shrink-0 text-right text-xs font-semibold text-slate-600">Hari ke-{dayCount}<br />dari {totalDays}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                 <Progress value={trialProgress?.percent ?? Math.min(100, Math.round((Math.min(totalDays, dayCount) / totalDays) * 100))} className="h-2.5 bg-slate-100" indicatorClassName="bg-amber-500" />
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
                  <span>Hari 1</span>
                  <span className="font-bold text-amber-700">Hari {totalDays}</span>
                </div>
              </div>

              {/* 3 Micro Stats */}
               <div className="grid grid-cols-1 gap-2 pt-2 text-left sm:grid-cols-3 sm:text-center">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <span className="text-lg font-black text-navy-900 block tabular-nums">{dayCount} hari</span>
                  <span className="text-xs text-slate-600 font-bold block leading-tight">
                    hari program berjalan
                  </span>
                </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-lg font-black text-navy-900 block">
                     {completedTodayCount}/{dailyHabits.length}
                  </span>
                  <span className="text-xs text-slate-600 font-bold block leading-tight">
                    Kebiasaan selesai hari ini
                  </span>
                </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-lg font-black text-emerald-700 block">
                     {isTrial ? "Spiritual" : "Bulan " + getActiveProgramMonth(dayCount)}
                  </span>
                  <span className="text-xs text-slate-600 font-bold block leading-tight">
                     {isTrial ? "area latihan" : "checkpoint aktif"}
                  </span>
                </div>
              </div>
            </div>

            {/* Clickable button to open Analytics Modal */}
            <div className="pt-3 border-t border-warm-border/60">
              <Link href="/monitoring">
                <Button
                  variant="outline"
                  className="w-full justify-between text-xs font-bold text-navy-900 border-warm-border hover:bg-warm-bg rounded-xl py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-700" />
                    Lihat Analitik Lengkap
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Button>
              </Link>
            </div>
          </Card>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button type="button" onClick={() => setSholatAnalyticsOpen(true)} className="flex min-h-14 w-full items-center justify-between px-5 text-sm font-medium text-navy-900 hover:bg-slate-50">Analitik salat <ChevronRight className="size-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => setQuranAnalyticsOpen(true)} className="flex min-h-14 w-full items-center justify-between px-5 text-sm font-medium text-navy-900 hover:bg-slate-50">Analitik tilawah <ChevronRight className="size-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => setHadithAnalyticsOpen(true)} className="flex min-h-14 w-full items-center justify-between px-5 text-sm font-medium text-navy-900 hover:bg-slate-50">Analitik hadits <ChevronRight className="size-4" aria-hidden="true" /></button>
            </div>
            {isTrial && <TrialAreaPreview />}
          </section>
        </div>

        {/* ─── BARIS 4: 1 CARD PANJANG HADITS ATAU PEPATAH TENTANG KONSISTENSI ─── */}
        <Card className="hidden bg-white border-warm-border p-5 md:p-6 rounded-2xl shadow-2xs lg:flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-navy-900 font-serif italic font-semibold leading-relaxed">
                &ldquo;Dan barang siapa bertakwa kepada Allah, niscaya Dia akan menjadikan baginya jalan keluar.&rdquo;
              </p>
              <span className="text-xs font-bold text-slate-600 block">
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
              <BookMarked className="h-5 w-5 text-amber-700" />
              Semua Catatan Journal Refleksi
            </DialogTitle>
          </DialogHeader>

          {/* Search bar */}
          <div className="py-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-600" />
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
                 openQuickJournal();
              }}
              className="bg-navy-900 text-amber-300 font-bold text-xs rounded-xl"
            >
              + Refleksi Baru
            </Button>
          </div>

          {/* List of journal cards */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredJournals.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-600 text-xs italic">
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
                        <Calendar className="h-3.5 w-3.5 text-amber-700" />
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
                            : "text-slate-600 hover:text-navy-900 hover:bg-warm-bg"
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

      {/* 2. MODAL TODAY'S TASKS & HABITS DETAIL */}
      <Dialog open={spiritualActivitiesOpen} onOpenChange={setSpiritualActivitiesOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle>Aktivitas spiritual hari ini</DialogTitle></DialogHeader>
          <ul className="divide-y divide-slate-100">
            {trialActivities.map(activity => (
              <li key={activity.label} className="flex items-center justify-between gap-4 py-4 text-sm">
                <div><p className="font-medium text-navy-900">{activity.label}</p>{activity.detail && <p className="mt-1 text-xs text-slate-600">{activity.detail}</p>}</div>
                <span className={activity.done ? "text-emerald-700" : "text-slate-600"}>{activity.done ? "Tercatat" : "Belum lengkap"}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={todayTasksModalOpen} onOpenChange={setTodayTasksModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-700" />
              Detail habit PTP
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <Tabs value={habitTab} onValueChange={value => setHabitTab(value as "daily" | "weekly")}>
              <TabsList className="grid h-9 w-full grid-cols-2 border-0 bg-slate-100 p-1">
                <TabsTrigger value="daily" className="h-7 border-0 text-xs shadow-none">Harian · {dailyHabits.length}</TabsTrigger>
                <TabsTrigger value="weekly" className="h-7 border-0 text-xs shadow-none">Pekanan · {weeklyHabits.length}</TabsTrigger>
              </TabsList>
              <TabsContent value="daily" className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold text-navy-900">
                  <span>Status hari ini:</span>
                  <span className="text-amber-800 font-black">{completedTodayCount} dari {dailyHabits.length} ({habitPercentage}%)</span>
                </div>
                <Progress value={habitPercentage} className="mt-2 h-2.5 bg-warm-bg" />
              </TabsContent>
              <TabsContent value="weekly" className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold text-navy-900">
                  <span>Status minggu ini:</span>
                  <span className="text-amber-800 font-black">{completedWeeklyUnits} dari {totalWeeklyUnits} kali</span>
                </div>
                <Progress value={totalWeeklyUnits > 0 ? Math.round(completedWeeklyUnits / totalWeeklyUnits * 100) : 0} className="mt-2 h-2.5 bg-warm-bg" />
              </TabsContent>
            </Tabs>

            <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-1">
              {visibleHabits.length === 0 && <p className="py-4 text-center text-sm text-slate-600">Belum ada habit {habitTab === "daily" ? "harian" : "pekanan"}. <Link href="/journey" className="font-medium text-navy-900 underline underline-offset-4">Atur di rencana perubahan</Link>.</p>}
              {visibleHabits.map((h) => {
                const isMultiStep = h.category === "general" && h.quantity > 1;
                return (
                  <button
                    key={h.id}
                    onClick={() => h.frequency === "weekly" ? (h.category === "general" && !h.completedToday ? incrementHabitCount(h.id) : toggleHabitToday(h.id)) : isMultiStep && !h.completedToday ? incrementHabitCount(h.id) : toggleHabitToday(h.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all text-left ${
                      h.completedToday
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        : "bg-warm-bg text-slate-700 border border-warm-border hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex-1 min-w-0">{h.title}</span>
                    {h.frequency === "weekly" ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">{h.completedCount}/{h.quantity} kali</span>
                    ) : isMultiStep && !h.completedToday ? (
                      <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">{h.completedCount}/{h.quantity} +</span>
                    ) : (
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${h.completedToday ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"}`}>
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
              <Sparkles className="h-5 w-5 text-amber-700" />
              Pepatah & Hadits Tentang Konsistensi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block">
                AL-QUR&apos;AN SURAH AT-TALAQ AYAT 2-3
              </span>
              <p className="text-sm font-serif italic text-navy-900 leading-relaxed">
                &ldquo;Dan barang siapa bertakwa kepada Allah, niscaya Dia akan menjadikan baginya jalan keluar, dan memberinya rezeki dari arah yang tidak disangka-sangka.&rdquo;
              </p>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 uppercase tracking-widest block">
                HADITS RIWAYAT MUSLIM
              </span>
              <p className="text-xs font-serif italic text-slate-800 leading-relaxed">
                &ldquo;Amalan yang paling dicintai oleh Allah Ta&apos;ala adalah amalan yang berkelanjutan (istiqamah) meskipun sedikit.&rdquo;
              </p>
              <p className="text-xs text-slate-600">
                Prinsip ini menjadi dasar metode SLJ: membangun kebiasaan kecil yang konsisten setiap hari selama {totalDays} hari.
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
        <DialogContent className="max-w-lg overflow-hidden rounded-2xl border-slate-200 p-0">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-navy-900">Refleksi hari ini</DialogTitle>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">Tuliskan apa yang terasa penting, tanpa perlu merapikan kata-kata.</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2 px-6 py-5">
            <label htmlFor="dashboard-journal" className="block text-xs font-bold text-slate-700">
              Catatan refleksi
            </label>
            <Textarea
              id="dashboard-journal"
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              maxLength={1000}
              placeholder="Apa yang kamu syukuri, pelajari, atau ingin perbaiki hari ini?"
              className="min-h-[180px] resize-none rounded-xl border-slate-200 p-4 font-serif text-sm leading-6 focus:border-amber-500"
            />
            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={journalIsPrivate} onChange={(e) => setJournalIsPrivate(e.target.checked)} />
                <Lock className="h-3 w-3" />
                {journalIsPrivate ? "Privat, hanya Anda yang dapat membaca" : "Bagikan dengan coach/tim berwenang"}
              </label>
              <span className="font-mono tabular-nums">{journalContent.length}/1000</span>
            </div>
            {journalSaveError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{journalSaveError}</p>}
          </div>
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button
              onClick={handleSaveJournal}
              disabled={!journalContent.trim()}
              className="h-10 w-full rounded-xl bg-navy-900 text-xs font-bold text-amber-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Simpan Refleksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ─── DEDICATED ANALYTICS MODAL: SHOLAT ─── */}
      <Dialog open={sholatAnalyticsOpen} onOpenChange={setSholatAnalyticsOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader className="border-b border-warm-border pb-3">
            <DialogTitle className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-700" />
              Analitik Khusus Sholat (Wajib & Sunnah)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xl font-black text-amber-900 block">
                  {sholatAnalytics ? `${sholatAnalytics.wajibDays}/7` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Sholat Wajib Lengkap</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-navy-900 block">
                  {sholatAnalytics ? `${sholatAnalytics.sunnahCount}` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Sholat Sunnah (7 Hari)</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">
                  {sholatAnalytics ? `${sholatAnalytics.streak} hari` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Streak Beruntun</span>
              </div>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 block">Ringkasan 7 Hari Terakhir</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {sholatAnalytics
                  ? sholatAnalytics.wajibDays === 7
                    ? "MasyaAllah! Anda konsisten sholat 5 waktu penuh selama 7 hari berturut-turut."
                    : sholatAnalytics.wajibDays >= 5
                    ? "Alhamdulillah, sholat wajib Anda sudah sangat konsisten. Pertahankan!"
                    : sholatAnalytics.wajibDays >= 3
                    ? "Bagus, Anda sudah rutin sholat 5 waktu. Tingkatkan konsistensi harian Anda."
                    : "Mulai biasakan sholat 5 waktu tepat waktu. Konsistensi adalah kunci."
                  : "Memuat data..."}
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
              <BookOpen className="h-5 w-5 text-amber-700" />
              Analitik Khusus Tilawah Al-Qur&apos;an
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xl font-black text-amber-900 block">
                  {quranAnalytics ? `${quranAnalytics.totalAyat} Ayat` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Total Tilawah (7 Hari)</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-navy-900 block">
                  {quranAnalytics ? `${quranAnalytics.totalDays} Hari` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Aktif Tilawah</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">
                  {quranAnalytics ? `${quranAnalytics.streak} Hari` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Streak Berturut</span>
              </div>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 block">Ringkasan Tilawah 7 Hari</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {quranAnalytics
                  ? quranAnalytics.streak >= 5
                    ? "MasyaAllah! Tilawah Anda sangat konsisten. Pertahankan!"
                    : quranAnalytics.totalDays >= 3
                    ? "Bagus, Anda sudah rutin tilawah. Tingkatkan konsistensi harian."
                    : "Mulai biasakan tilawah setiap hari. 15-30 menit setelah Subuh sangat dianjurkan."
                  : "Memuat data..."}
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
              <Sparkles className="h-5 w-5 text-amber-700" />
              Analitik Khusus Baca & Tadabbur Hadits
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xl font-black text-amber-900 block">
                  {hadithAnalytics ? `${hadithAnalytics.totalRead} Hari` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Telah Dibaca (7 Hari)</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-navy-900 block">
                  {hadithAnalytics ? `${hadithAnalytics.streak} Hari` : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Streak Berturut</span>
              </div>
              <div className="bg-warm-bg border border-warm-border p-3 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">
                  {hadithAnalytics && hadithAnalytics.totalRead >= 5 ? "Konsisten" : hadithAnalytics ? "Aktif" : "--"}
                </span>
                <span className="text-xs text-slate-600 font-bold block">Status Pekan Ini</span>
              </div>
            </div>

            <div className="bg-warm-bg p-4 rounded-xl border border-warm-border space-y-2">
              <span className="text-xs font-bold text-navy-900 block">Ringkasan 7 Hari</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {hadithAnalytics
                  ? hadithAnalytics.streak >= 5
                    ? "MasyaAllah! Anda konsisten membaca hadits setiap hari. Pertahankan!"
                    : hadithAnalytics.totalRead >= 3
                    ? "Bagus, Anda sudah rutin membaca hadits. Tingkatkan konsistensi."
                    : "Mulai biasakan membaca hadits harian. Ambil satu hadits, renungkan maknanya."
                  : "Memuat data..."}
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

      {/* ─── WELCOME MODAL ────────────────────────────────────────────── */}
      {welcomeModalOpen && (
        <Dialog open={welcomeModalOpen} onOpenChange={(open) => {
          if (!open) void handleDismissWelcome();
        }}>
          <DialogContent className="overflow-hidden rounded-2xl border border-[#E7E2D8] bg-white p-0 shadow-[0_24px_70px_-24px_rgba(15,30,61,0.28)] sm:max-w-[420px]">
            <div className="px-6 py-7 sm:px-8 sm:py-8">
              <DialogHeader className="items-center space-y-0 text-center">
                <img
                  src="/BinaJourney_logo.webp"
                  alt="BinaJourney"
                  className="h-8 w-auto object-contain"
                />
                <DialogTitle className="max-w-xs pt-7 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#0F1E3D]">
                  Selamat Datang, {userName}!
                </DialogTitle>
                <p className="pt-2.5 text-sm leading-relaxed text-slate-600">
                  Perjalanan {totalDays} hari Anda dimulai.
                </p>
              </DialogHeader>

              <DialogFooter className="mt-8 flex-col gap-2 sm:flex-col">
                <Button
                  onClick={handleWelcomeCTA}
                  className="h-11 w-full rounded-lg bg-[#0F1E3D] text-sm font-bold text-white transition-all duration-200 hover:bg-[#182B50] active:scale-[0.98]"
                >
                  Matching
                </Button>
                <Button
                  onClick={handleDismissWelcome}
                  variant="ghost"
                  className="h-10 w-full rounded-lg text-xs font-semibold text-slate-600 transition-colors hover:bg-[#FAF8F4] hover:text-[#0F1E3D] active:scale-[0.98]"
                >
                  Nanti saja
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ParticipantLayout>
  );
}
