"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronRight, Check, Lock, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_TIME_ZONE,
  getLocalDateString,
  getTimeZoneLabel,
  resolveParticipantTimeZone,
} from "@/lib/local-date";
import { getProgramDay } from "@/lib/program-timeline";
import { TRIAL_DAYS, TRIAL_PROGRAM_CODE } from "@/lib/program-access";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { ParticipantPageSkeleton } from "@/components/layout/ParticipantPageSkeleton";
import { cn } from "@/lib/utils";
import {
  getCanonicalJournalDate,
  getJournalStreak,
  getJourneyDayForDate,
  parseJournalContent,
  composeJournalContent,
} from "@/lib/journal";

// ── DAILY PROMPTS MAPPING (DAY 1 TO 90) ─────────────────────────────────────

const DAILY_PROMPTS: Record<number, string> = {
  1: "Apa niat terbaik yang ingin Anda jaga hari ini?",
  2: "Apa rasa syukur pertama yang hadir saat Anda bangun tidur pagi ini?",
  3: "Siapa orang yang ingin Anda beri kebaikan atau doa hari ini?",
  4: "Bagaimana kondisi Anda saat melaksanakan ibadah hari ini?",
  5: "Apa godaan atau gangguan terbesar yang Anda rasakan hari ini?",
  7: "Apa perubahan kecil yang paling Anda rasakan dalam satu minggu pertama ini?",
  10: "Ibadah mana yang terasa paling nikmat dan tenang Anda jalani hari ini?",
  14: "Apa pelajaran dari kejadian yang membuat Anda kurang nyaman hari ini?",
  17: "Kapan hari ini Anda merasa paling dekat dengan Allah?",
  21: "Kebiasaan baik apa yang mulai terasa lebih mudah dijalankan?",
  24: "Kapan hari ini Anda merasa paling dekat dengan Allah?",
  30: "Apa pelajaran terbesar tentang kesabaran yang Allah ajarkan bulan ini?",
  37: "Barang siapa mengenal dirinya, maka ia akan mengenal Rabbnya. Apa yang Anda pelajari tentang diri Anda hari ini?",
  41: "Godaan terbesar hari ini apa, dan bagaimana Anda menghadapinya?",
  50: "Jika Anda melihat diri Anda di Hari ke-1, perubahan positif apa yang paling terlihat?",
  60: "Bagaimana hubungan Anda dengan keluarga dan orang-orang terdekat Anda saat ini?",
  75: "Bagaimana Anda menjaga istiqamah di saat rasa lelah datang?",
  82: "Apa perubahan terbesar yang Anda rasakan mendekati akhir 90 hari ini?",
  90: "Pesan dan komitmen apa yang ingin Anda sampaikan pada diri Anda sendiri untuk masa depan?",
};

function getPromptForDay(day: number): string {
  if (DAILY_PROMPTS[day]) return DAILY_PROMPTS[day];
  const generic = [
    "Kapan hari ini Anda merasa paling dekat dengan Allah?",
    "Apa momen paling berharga atau hikmah yang Allah tunjukkan hari ini?",
    "Bagaimana kondisi hati Anda saat menjalani aktivitas dan ibadah hari ini?",
    "Apa bentuk rasa syukur terkecil namun terasa paling hangat hari ini?",
  ];
  return generic[day % generic.length];
}

// ── 5 MOOD OPTIONS ─────────────────────────────────────────────────────────

const MOOD_ITEMS = [
  { label: "Tenang", emoji: "🙂" },
  { label: "Bersyukur", emoji: "😊" },
  { label: "Bersemangat", emoji: "💪" },
  { label: "Butuh Doa", emoji: "🤲" },
  { label: "Berat", emoji: "😔" },
];

interface JournalPost {
  id: string;
  dayNumber: number;
  dateStr: string;
  canonicalDate: string;
  timeStr: string;
  location: string;
  content: string;
  pelajaran?: string;
  perbaikanBesok?: string;
  mood: string;
  isFavorite: boolean;
  isPrivate: boolean;
}

export default function JournalPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState("Jakarta");
  const [journalTimeZone, setJournalTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [journeyStartDate, setJourneyStartDate] = useState<string | null>(null);
  const [dayCount, setDayCount] = useState(1);
  const [totalDays, setTotalDays] = useState(90);
  const [dateFormatted, setDateFormatted] = useState("");
  const [dailyPrompt, setDailyPrompt] = useState("");
  const [streakCount, setStreakCount] = useState(0);

  // Form Inputs
  const [mainReflection, setMainReflection] = useState("");
  const [selectedMood, setSelectedMood] = useState("Bersyukur");
  const [pelajaran, setPelajaran] = useState("");
  const [perbaikanBesok, setPerbaikanBesok] = useState("");
  const [journalIsPrivate, setJournalIsPrivate] = useState(true);

  // Live Digital Clock & Adaptive Background
  const [heroClockHH, setHeroClockHH] = useState<string>("--");
  const [heroClockMM, setHeroClockMM] = useState<string>("--");
  const [adaptiveJournalBg, setAdaptiveJournalBg] = useState<string>("/malam-journal.webp");

  useEffect(() => {
    const clockFormat = new Intl.DateTimeFormat("en-GB", {
      timeZone: journalTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const updateClock = () => {
      const d = new Date();
      const parts = clockFormat.formatToParts(d);
      const hh = parts.find((part) => part.type === "hour")?.value || "00";
      const mm = parts.find((part) => part.type === "minute")?.value || "00";
      setHeroClockHH(hh);
      setHeroClockMM(mm);

      // Adaptive background based on time
      const totalMins = Number(hh) * 60 + Number(mm);
      if (totalMins >= 240 && totalMins < 360) {
        setAdaptiveJournalBg("/fajar-journal.webp"); // 04:00 - 06:00
      } else if (totalMins >= 360 && totalMins < 660) {
        setAdaptiveJournalBg("/pagi-journal.webp"); // 06:00 - 11:00
      } else if (totalMins >= 660 && totalMins < 900) {
        setAdaptiveJournalBg("/siang-journal.webp"); // 11:00 - 15:00
      } else if (totalMins >= 900 && totalMins < 1050) {
        setAdaptiveJournalBg("/sore-journal.webp"); // 15:00 - 17:30
      } else if (totalMins >= 1050 && totalMins < 1140) {
        setAdaptiveJournalBg("/senja-journal.webp"); // 17:30 - 19:00
      } else {
        setAdaptiveJournalBg("/malam-journal.webp"); // 19:00 - 04:00
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 30_000);
    return () => clearInterval(interval);
  }, [journalTimeZone]);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [favoriteError, setFavoriteError] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState<string | null>(null);
  const savingReflection = useRef(false);
  const reflectionInput = useRef<HTMLTextAreaElement>(null);
  const optionalFields = useRef<HTMLDetailsElement>(null);

  const [journalView, setJournalView] = useState<"write" | "history">("write");
  const [historySearch, setHistorySearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "history")
      setJournalView("history");
  }, []);

  const selectJournalView = (view: "write" | "history") => {
    setJournalView(view);
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);
  };

  // Saved reflections for history.
  const [posts, setPosts] = useState<JournalPost[]>([]);

  // Selected Detail Modal Post
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);

  // ── LOAD DATA ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login telah berakhir.");

      const [profileResult, settingsResult, journalResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("start_date,program_code,timezone,timezone_mode,location")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("settings")
          .select("journal_privacy_default")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("journals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      const error = profileResult.error || settingsResult.error || journalResult.error;
      if (error) throw error;
      const profile = profileResult.data;
      const resolvedTimeZone = resolveParticipantTimeZone(
        profile?.timezone || DEFAULT_TIME_ZONE,
        profile?.timezone_mode || "AUTO",
      );
      setJournalTimeZone(resolvedTimeZone);
      const startDate = profile?.start_date
        ? getLocalDateString(new Date(profile.start_date), resolvedTimeZone)
        : null;
      let currentDay = 1;

      if (profile) {
        setTotalDays(profile.program_code === TRIAL_PROGRAM_CODE ? TRIAL_DAYS : 90);
        if (profile.location) {
          setUserLocation(profile.location);
        }
        if (profile.start_date) {
          setJourneyStartDate(startDate);
          currentDay = getProgramDay(profile.start_date, new Date(), resolvedTimeZone);
        }
      }

      const privacyDefault = settingsResult.data?.journal_privacy_default ?? true;

      setDayCount(currentDay);
      setDailyPrompt(getPromptForDay(currentDay));

      const now = new Date();
      const today = getLocalDateString(now, resolvedTimeZone);
      setDateFormatted(
        now.toLocaleDateString("id-ID", {
          timeZone: resolvedTimeZone,
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );

      const journals = journalResult.data;

      if (journals && journals.length > 0) {
        const todayJournal = journals.find(
          (journal: any) => getCanonicalJournalDate(journal.date || journal.created_at) === today,
        );
        setJournalIsPrivate(todayJournal ? (todayJournal.is_private ?? true) : privacyDefault);
        setStreakCount(
          getJournalStreak(
            journals.map((journal: any) => journal.date || journal.created_at),
            today,
          ),
        );
        setPosts(
          journals.map((j: any) => {
            const d = new Date(j.created_at || j.date);
            const canonicalDate =
              getCanonicalJournalDate(j.date) || getLocalDateString(d, resolvedTimeZone);
            const dateStr = new Date(canonicalDate + "T00:00:00Z").toLocaleDateString("id-ID", {
              timeZone: "UTC",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const timeStr =
              d.toLocaleTimeString("id-ID", {
                timeZone: resolvedTimeZone,
                hour: "2-digit",
                minute: "2-digit",
              }) +
              " " +
              getTimeZoneLabel(resolvedTimeZone);
            const parsed = parseJournalContent(j.content);

            return {
              id: j.id,
              canonicalDate,
              dayNumber: getJourneyDayForDate(canonicalDate, startDate),
              dateStr,
              timeStr,
              location: j.location || profile?.location || "Jakarta",
              content: parsed.reflection,
              pelajaran: parsed.lesson,
              perbaikanBesok: parsed.improvement,
              mood: j.mood || "Bersyukur",
              isFavorite: j.is_favorite ?? false,
              isPrivate: j.is_private ?? true,
            };
          }),
        );
      } else {
        setJournalIsPrivate(privacyDefault);
        // Empty state — tidak ada data jurnal (jangan tampilkan data palsu)
        setPosts([]);
        setStreakCount(0);
      }
    } catch (err) {
      console.error("Gagal memuat jurnal:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── SAVE REFLECTION ──────────────────────────────────────────────────────

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingReflection.current || !mainReflection.trim()) return;

    savingReflection.current = true;
    setSaving(true);
    setSavedSuccess(false);
    setSaveError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("Sesi login telah berakhir. Silakan login ulang.");
        return;
      }

      const now = new Date();
      const { data: profileTimeZone } = await supabase
        .from("profiles")
        .select("timezone, timezone_mode")
        .eq("user_id", user.id)
        .maybeSingle();
      const resolvedTimeZone = resolveParticipantTimeZone(
        profileTimeZone?.timezone || DEFAULT_TIME_ZONE,
        profileTimeZone?.timezone_mode || "AUTO",
      );
      const todayStr = getLocalDateString(now, resolvedTimeZone);
      const timeStr =
        now.toLocaleTimeString("id-ID", {
          timeZone: resolvedTimeZone,
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        getTimeZoneLabel(resolvedTimeZone);

      const combinedContent = composeJournalContent(mainReflection, pelajaran, perbaikanBesok);

      const existingToday = posts.find((post) => post.canonicalDate === todayStr);
      const journalPayload = {
        content: combinedContent,
        mood: selectedMood,
        is_private: journalIsPrivate,
        location: userLocation,
      };
      const saveQuery = existingToday
        ? supabase.from("journals").update(journalPayload).eq("id", existingToday.id)
        : supabase.from("journals").insert({ user_id: user.id, date: todayStr, ...journalPayload });
      const { data, error } = await saveQuery.select().single();

      if (error) {
        console.error("Gagal menyimpan refleksi:", error);
        setSaveError("Refleksi belum tersimpan. Coba lagi.");
        return;
      }

      if (data) {
        const newPost: JournalPost = {
          id: data.id,
          canonicalDate: todayStr,
          dayNumber: getJourneyDayForDate(todayStr, journeyStartDate) || dayCount,
          dateStr: now.toLocaleDateString("id-ID", {
            timeZone: resolvedTimeZone,
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          timeStr,
          location: userLocation,
          content: mainReflection.trim(),
          pelajaran: pelajaran.trim(),
          perbaikanBesok: perbaikanBesok.trim(),
          mood: selectedMood,
          isFavorite: data.is_favorite ?? existingToday?.isFavorite ?? false,
          isPrivate: data.is_private ?? journalPayload.is_private,
        };

        setPosts((prev) => [newPost, ...prev.filter((post) => post.canonicalDate !== todayStr)]);
        setStreakCount(
          getJournalStreak([...posts.map((post) => post.canonicalDate), todayStr], todayStr),
        );
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error("Gagal menyimpan refleksi:", err);
      setSaveError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      savingReflection.current = false;
      setSaving(false);
    }
  };

  const toggleFavorite = async (post: JournalPost) => {
    setFavoriteError(false);
    setSavingFavorite(post.id);
    const isFavorite = !post.isFavorite;
    try {
      const { error } = await supabase
        .from("journals")
        .update({ is_favorite: isFavorite })
        .eq("id", post.id);
      if (error) throw error;
      setPosts((previous) =>
        previous.map((entry) => (entry.id === post.id ? { ...entry, isFavorite } : entry)),
      );
    } catch {
      setFavoriteError(true);
    } finally {
      setSavingFavorite(null);
    }
  };

  function editToday(post: JournalPost) {
    setMainReflection(post.content);
    setPelajaran(post.pelajaran || "");
    setPerbaikanBesok(post.perbaikanBesok || "");
    setSelectedMood(post.mood);
    setJournalIsPrivate(post.isPrivate);
    setSavedSuccess(false);
    selectJournalView("write");
    requestAnimationFrame(() => {
      if (optionalFields.current)
        optionalFields.current.open = Boolean(post.pelajaran || post.perbaikanBesok);
      reflectionInput.current?.focus();
    });
  }

  if (loading) return <ParticipantPageSkeleton kind="journal" />;

  if (loadError) {
    return (
      <ParticipantLayout activePath="/journal" pageTitle="Jurnal refleksi">
        <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-navy-900">Jurnal belum dapat dibuka</h1>
          <p role="alert" className="text-sm leading-6 text-slate-600">
            Periksa koneksi Anda, lalu coba muat ulang jurnal.
          </p>
          <Button onClick={() => void loadData()}>Muat ulang</Button>
        </section>
      </ParticipantLayout>
    );
  }

  const todayPost = posts.find(
    (post) => post.canonicalDate === getLocalDateString(new Date(), journalTimeZone),
  );
  const search = historySearch.trim().toLocaleLowerCase("id-ID");
  const visiblePosts = posts
    .filter((post) => !onlyFavorites || post.isFavorite)
    .filter((post) =>
      [post.content, post.pelajaran, post.perbaikanBesok, post.dateStr]
        .join(" ")
        .toLocaleLowerCase("id-ID")
        .includes(search),
    )
    .sort((a, b) => b.canonicalDate.localeCompare(a.canonicalDate));
  const mobilePanel = (view: "write" | "history") =>
    cn("min-w-0", journalView !== view && "hidden lg:block");

  return (
    <ParticipantLayout activePath="/journal" pageTitle="Jurnal refleksi">
      <div className="mx-auto max-w-6xl space-y-6 pb-6">
        <header
          className="relative overflow-hidden rounded-3xl bg-navy-900 p-5 text-white sm:p-7"
          style={{
            backgroundImage:
              "linear-gradient(90deg,rgba(7,26,51,.94),rgba(7,26,51,.66)),url('" +
              adaptiveJournalBg +
              "')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/80">
            <span>
              Hari ke-{dayCount} dari {totalDays}
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <span>
                {heroClockHH}:{heroClockMM}
              </span>
              <span aria-hidden="true">·</span>
              <span>{getTimeZoneLabel(journalTimeZone)}</span>
            </span>
          </div>
          <h1 className="mt-5 text-balance text-2xl font-semibold sm:text-3xl">Refleksi Hari Ini</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/85">
            Ruang untuk mencatat yang Anda rasakan, pelajari, dan ingin perbaiki.
          </p>
          <p className="mt-4 text-xs text-white/75">{dateFormatted}</p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-navy-900 tabular-nums">{posts.length}</span> catatan
            tersimpan <span className="mx-2 text-slate-300">·</span>
            <span className="font-semibold text-navy-900 tabular-nums">{streakCount}</span> hari
            berturut-turut
          </p>
          <p className="flex items-center gap-1.5 text-xs">
            <Lock aria-hidden="true" className="size-3.5" /> Anda mengatur privasi tiap catatan
          </p>
        </div>

        <div
          role="group"
          aria-label="Tampilan jurnal"
          className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 lg:hidden"
        >
          {(
            [
              { id: "write", label: "Menulis" },
              { id: "history", label: "Riwayat" },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-pressed={journalView === item.id}
              aria-controls={"journal-" + item.id}
              onClick={() => selectJournalView(item.id)}
              className={cn(
                "min-h-11 rounded-xl text-sm",
                journalView === item.id ? "bg-white text-navy-900 shadow-sm" : "text-slate-600",
              )}
            >
              {item.label}
              {item.id === "history" && (
                <span className="ml-2 text-xs tabular-nums text-slate-500">{posts.length}</span>
              )}
            </Button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section
            id="journal-write"
            aria-label="Menulis refleksi"
            className={cn(mobilePanel("write"), "lg:col-span-2")}
          >
            <form
              onSubmit={handleSaveReflection}
              onChange={() => setSavedSuccess(false)}
              className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7"
            >
              <div>
                <h2 className="text-lg font-semibold text-navy-900">
                  Apa yang ingin Anda ingat hari ini?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{dailyPrompt}</p>
              </div>
              {todayPost && !mainReflection.trim() && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm text-slate-700">
                  <p>Catatan hari ini sudah tersimpan.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saving}
                    className="min-h-11"
                    onClick={() => editToday(todayPost)}
                  >
                    Edit catatan
                  </Button>
                </div>
              )}
              <div>
                <label
                  htmlFor="journal-reflection"
                  className="mb-2 block text-sm font-medium text-navy-900"
                >
                  Refleksi hari ini
                </label>
                <Textarea
                  ref={reflectionInput}
                  id="journal-reflection"
                  rows={5}
                  maxLength={1000}
                  value={mainReflection}
                  onChange={(event) => setMainReflection(event.target.value)}
                  placeholder="Mulai dari satu momen yang bermakna bagi Anda…"
                  className="min-h-36 resize-y rounded-2xl border-slate-200 p-4 text-base leading-7 sm:text-sm"
                />
                <p className="mt-2 text-right text-xs tabular-nums text-slate-500">
                  {mainReflection.length}/1000 karakter
                </p>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-navy-900">
                  Bagaimana perasaan Anda hari ini?
                </legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {MOOD_ITEMS.map((mood) => (
                    <button
                      type="button"
                      key={mood.label}
                      aria-pressed={selectedMood === mood.label}
                      onClick={() => {
                        setSelectedMood(mood.label);
                        setSavedSuccess(false);
                      }}
                      className={cn(
                        "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-xs transition-colors",
                        selectedMood === mood.label
                          ? "border-blue-200 bg-blue-50 font-semibold text-navy-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span aria-hidden="true" className="text-2xl">
                        {mood.emoji}
                      </span>
                      {mood.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <details ref={optionalFields} className="group rounded-2xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-medium text-navy-900">
                  Lengkapi refleksi <span className="ml-1 font-normal text-slate-500">(opsional)</span>
                </summary>
                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="journal-lesson"
                      className="mb-2 block text-sm font-medium text-navy-900"
                    >
                      Pelajaran hari ini
                    </label>
                    <Textarea
                      id="journal-lesson"
                      rows={3}
                      maxLength={500}
                      value={pelajaran}
                      onChange={(event) => setPelajaran(event.target.value)}
                      placeholder="Apa yang Anda pelajari dari pengalaman hari ini?"
                      className="rounded-xl border-slate-200 text-base leading-7 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="journal-improvement"
                      className="mb-2 block text-sm font-medium text-navy-900"
                    >
                      Rencana perbaikan besok
                    </label>
                    <Textarea
                      id="journal-improvement"
                      rows={3}
                      maxLength={500}
                      value={perbaikanBesok}
                      onChange={(event) => setPerbaikanBesok(event.target.value)}
                      placeholder="Satu langkah kecil yang ingin Anda lakukan…"
                      className="rounded-xl border-slate-200 text-base leading-7 sm:text-sm"
                    />
                  </div>
                </div>
              </details>

              <details className="text-sm leading-7 text-slate-600">
                <summary className="min-h-11 cursor-pointer content-center font-medium text-navy-900">
                  Panduan refleksi
                </summary>
                <h3 className="mt-3 font-medium text-navy-900">Panduan Mujahadah</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5">
                  <li>
                    Apa pelajaran terbesar yang Allah tunjukkan kepada Anda selama perjalanan ini?
                  </li>
                  <li>Apa yang bisa Anda lakukan lebih baik bila ada kesempatan kembali?</li>
                  <li>Apa amal atau kebiasaan yang akan Anda jaga sepulang dari Tanah Suci?</li>
                </ol>
                {dayCount >= totalDays && (
                  <>
                    <h3 className="mt-4 font-medium text-navy-900">
                      Panduan Istiqamah · Refleksi {totalDays} Hari
                    </h3>
                    <ol className="mt-2 list-decimal space-y-2 pl-5">
                      <li>
                        Perubahan apa yang mulai Anda rasakan? Bagaimana dampaknya terhadap diri,
                        pekerjaan, dan lingkungan Anda?
                      </li>
                      <li>Apa tantangan terbesar yang dapat melemahkan komitmen Anda?</li>
                      <li>
                        Apa kebiasaan yang akan Anda jaga agar perubahan ini bertahan sepanjang
                        perjalanan Anda?
                      </li>
                    </ol>
                  </>
                )}
              </details>

              <div className="space-y-4 border-t border-slate-100 pt-5">
                <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    checked={journalIsPrivate}
                    onChange={(event) => setJournalIsPrivate(event.target.checked)}
                    className="mt-1 size-4 shrink-0 accent-navy-900"
                  />
                  <span>
                    <span className="block font-medium text-navy-900">Jadikan catatan privat</span>
                    {journalIsPrivate
                      ? "Hanya Anda yang dapat membaca."
                      : "Pendamping yang berwenang dapat membaca."}
                  </span>
                </label>
                {saveError && (
                  <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                    {saveError}
                  </p>
                )}
                {savedSuccess && todayPost && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                    <p role="status" className="flex items-center gap-2">
                      <Check className="size-4" aria-hidden="true" /> Refleksi hari ini tersimpan.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => setSelectedPost(todayPost)}
                    >
                      Lihat catatan
                    </Button>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={saving || Boolean(savingFavorite) || !mainReflection.trim() || savedSuccess}
                  className="min-h-12 w-full rounded-2xl bg-navy-900 text-sm text-white"
                >
                  {saving
                    ? "Menyimpan…"
                    : todayPost
                      ? "Perbarui Catatan Hari Ini"
                      : "Simpan Refleksi Hari Ini"}
                </Button>
              </div>
            </form>
          </section>

          <section
            id="journal-history"
            aria-label="Riwayat refleksi"
            className={mobilePanel("history")}
          >
            <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Riwayat refleksi</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Baca kembali momen dan pelajaran Anda.
                </p>
              </div>
              <div className="space-y-3">
                <label className="sr-only" htmlFor="journal-search">
                  Cari catatan jurnal
                </label>
                <Input
                  id="journal-search"
                  type="search"
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Cari isi atau tanggal catatan"
                  className="min-h-11 rounded-xl text-base sm:text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  aria-pressed={onlyFavorites}
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={cn(
                    "min-h-11 rounded-xl text-xs",
                    onlyFavorites ? "bg-amber-50 text-amber-800" : "text-slate-600",
                  )}
                >
                  <Heart
                    className={cn("mr-2 size-4", onlyFavorites && "fill-current")}
                    aria-hidden="true"
                  />{" "}
                  Hanya favorit
                </Button>
              </div>
              {favoriteError && (
                <p role="alert" className="text-sm text-rose-700">
                  Favorit belum berhasil diperbarui. Coba lagi.
                </p>
              )}
              {visiblePosts.length === 0 ? (
                <div className="space-y-3 py-6 text-center">
                  <p className="text-sm font-medium text-navy-900">
                    {posts.length ? "Tidak ada catatan yang sesuai." : "Belum ada refleksi."}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {posts.length
                      ? "Coba kata lain atau tampilkan semua catatan."
                      : "Mulai dengan satu momen yang berarti hari ini."}
                  </p>
                  {posts.length ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setHistorySearch("");
                        setOnlyFavorites(false);
                      }}
                    >
                      Tampilkan semua
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        selectJournalView("write");
                        requestAnimationFrame(() => reflectionInput.current?.focus());
                      }}
                    >
                      Tulis refleksi pertama
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {visiblePosts.map((post) => (
                    <li key={post.id} className="flex items-start gap-2 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="min-w-0 flex-1 space-y-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <span className="block text-xs text-slate-500">
                          {post.dateStr} · Hari {post.dayNumber}
                        </span>
                        <span className="block line-clamp-3 text-sm leading-6 text-navy-900">
                          {post.content}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          {post.mood}
                          <span aria-hidden="true">·</span>
                          {post.isPrivate ? "Privat" : "Dibagikan ke pendamping"}
                          <ChevronRight className="size-3.5" aria-hidden="true" />
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={
                          (post.isFavorite ? "Hapus favorit " : "Tandai favorit ") + post.dateStr
                        }
                        aria-pressed={post.isFavorite}
                        disabled={Boolean(savingFavorite) || saving}
                        onClick={() => void toggleFavorite(post)}
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-50",
                          post.isFavorite
                            ? "bg-amber-50 text-amber-700"
                            : "text-slate-400 hover:bg-slate-50",
                        )}
                      >
                        <Heart
                          className={cn("size-4", post.isFavorite && "fill-current")}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <Dialog
          open={Boolean(selectedPost)}
          onOpenChange={(open) => {
            if (!open) setSelectedPost(null);
          }}
        >
          <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl">
            {selectedPost && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Refleksi hari ke-{selectedPost.dayNumber}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
                    {selectedPost.dateStr} · {selectedPost.timeStr}
                    <br />
                    {selectedPost.isPrivate ? "Catatan privat" : "Dibagikan ke pendamping"} ·{" "}
                    {selectedPost.mood}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 text-sm leading-7 text-slate-700">
                  <p className="whitespace-pre-wrap break-words">{selectedPost.content}</p>
                  {selectedPost.pelajaran && (
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="mb-2 font-semibold text-navy-900">Pelajaran hari ini</h3>
                      <p className="whitespace-pre-wrap break-words">{selectedPost.pelajaran}</p>
                    </div>
                  )}
                  {selectedPost.perbaikanBesok && (
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="mb-2 font-semibold text-navy-900">Rencana perbaikan besok</h3>
                      <p className="whitespace-pre-wrap break-words">{selectedPost.perbaikanBesok}</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="min-h-11 w-full rounded-xl"
                    onClick={() => setSelectedPost(null)}
                  >
                    Tutup Refleksi
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ParticipantLayout>
  );
}
