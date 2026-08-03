"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Flame,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  Lightbulb,
  Edit3,
  Smile,
  BookOpen,
  Target,
  Send,
  Heart,
  MessageCircle,
  Calendar,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TIME_ZONE, getLocalDateString, resolveParticipantTimeZone } from "@/lib/local-date";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { getJournalStreak, getJourneyDayForDate, parseJournalContent, composeJournalContent } from "@/lib/journal";

// ── DAILY PROMPTS MAPPING (DAY 1 TO 90) ─────────────────────────────────────

const DAILY_PROMPTS: Record<number, string> = {
  1: "Apa niat terbaik yang ingin kamu jaga hari ini?",
  2: "Apa rasa syukur pertama yang hadir saat kamu bangun tidur pagi ini?",
  3: "Siapa orang yang ingin kamu beri kebaikan atau doa hari ini?",
  4: "Bagaimana kondisimu saat melaksanakan ibadah hari ini?",
  5: "Apa godaan atau gangguan terbesar yang kamu rasakan hari ini?",
  7: "Apa perubahan kecil yang paling kamu rasakan dalam satu minggu pertama ini?",
  10: "Ibadah mana yang terasa paling nikmat dan tenang kamu jalani hari ini?",
  14: "Apa pelajaran dari kejadian yang membuatmu kurang nyaman hari ini?",
  17: "Kapan hari ini kamu merasa paling dekat dengan Allah?",
  21: "Kebiasaan baik apa yang mulai terasa lebih mudah dijalankan?",
  24: "Kapan hari ini kamu merasa paling dekat dengan Allah?",
  30: "Apa pelajaran terbesar tentang kesabaran yang Allah ajarkan bulan ini?",
  37: "Barang siapa mengenal dirinya, maka ia akan mengenal Rabbnya. Apa yang kamu pelajari tentang dirimu hari ini?",
  41: "Godaan terbesar hari ini apa, dan bagaimana kamu menghadapinya?",
  50: "Jika kamu melihat dirimu di Hari ke-1, perubahan positif apa yang paling terlihat?",
  60: "Bagaimana hubunganmu dengan keluarga dan orang-orang terdekatmu saat ini?",
  75: "Bagaimana kamu menjaga istiqamah di saat rasa lelah datang?",
  82: "Apa perubahan terbesar yang kamu rasakan mendekati akhir 90 hari ini?",
  90: "Pesan dan komitmen apa yang ingin kamu sampaikan pada dirimu sendiri untuk masa depan?",
};

function getPromptForDay(day: number): string {
  if (DAILY_PROMPTS[day]) return DAILY_PROMPTS[day];
  const generic = [
    "Kapan hari ini kamu merasa paling dekat dengan Allah?",
    "Apa momen paling berharga atau hikmah yang Allah tunjukkan hari ini?",
    "Bagaimana kondisi hatimu saat menjalani aktivitas dan ibadah hari ini?",
    "Apa bentuk rasa syukur terkecil namun terasa paling hangat hari ini?",
  ];
  return generic[day % generic.length];
}

// ── 5 MOOD OPTIONS ─────────────────────────────────────────────────────────

const MOOD_ITEMS = [
  { label: "Tenang", emoji: "🙂", colorClass: "border-emerald-500 text-emerald-600 bg-emerald-50/60" },
  { label: "Bersyukur", emoji: "😊", colorClass: "border-amber-500 text-amber-600 bg-amber-50/60" },
  { label: "Bersemangat", emoji: "💪", colorClass: "border-blue-500 text-blue-600 bg-blue-50/60" },
  { label: "Butuh Doa", emoji: "🤲", colorClass: "border-purple-500 text-purple-600 bg-purple-50/60" },
  { label: "Berat", emoji: "😔", colorClass: "border-rose-500 text-rose-600 bg-rose-50/60" },
];

interface JournalPost {
  id: string;
  dayNumber: number;
  dateStr: string;
  timeStr: string;
  location: string;
  userFullName: string;
  userAvatar: string;
  content: string;
  pelajaran?: string;
  perbaikanBesok?: string;
  mood: string;
  isLiked: boolean;
  likeCount: number;
}

export default function RefactoredJournalPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Faisal");
  const [userLocation, setUserLocation] = useState("Jakarta");
  const [journeyStartDate, setJourneyStartDate] = useState<string | null>(null);
  const [dayCount, setDayCount] = useState(24);
  const [dateFormatted, setDateFormatted] = useState("Rabu, 29 Juli 2026");
  const [dailyPrompt, setDailyPrompt] = useState("");
  const [streakCount, setStreakCount] = useState(18);

  // Form Inputs
  const [mainReflection, setMainReflection] = useState("");
  const [selectedMood, setSelectedMood] = useState("Bersyukur");
  const [pelajaran, setPelajaran] = useState("");
  const [perbaikanBesok, setPerbaikanBesok] = useState("");

  // Live Digital Clock & Adaptive Background
  const [heroClockHH, setHeroClockHH] = useState<string>("18");
  const [heroClockMM, setHeroClockMM] = useState<string>("50");
  const [showColon, setShowColon] = useState<boolean>(true);
  const [adaptiveJournalBg, setAdaptiveJournalBg] = useState<string>("/malam-journal.webp");

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setHeroClockHH(hh);
      setHeroClockMM(mm);
      setShowColon(d.getSeconds() % 2 === 0);

      // Adaptive background based on time
      const totalMins = d.getHours() * 60 + d.getMinutes();
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
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Collapsible guide states
  const [showMujahadah, setShowMujahadah] = useState(false);
  const [showIstiqamah, setShowIstiqamah] = useState(false);

  // Instagram-style Posts for Right Column
  const [posts, setPosts] = useState<JournalPost[]>([]);

  // Selected Detail Modal Post
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);

  // ── LOAD DATA ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      let currentDay = 24;
      let fName = "Faisal";

      if (profile) {
        fName = profile.full_name || "Faisal";
        setUserName(fName.split(" ")[0]);
        if (profile.location) {
          setUserLocation(profile.location);
        }
        if (profile.start_date) {
          setJourneyStartDate(profile.start_date);
          const startD = new Date(profile.start_date);
          const diff = Math.floor((Date.now() - startD.getTime()) / 86400000);
          currentDay = Math.max(1, diff + 1);
        }
      }

      setDayCount(currentDay);
      setDailyPrompt(getPromptForDay(currentDay));

      const now = new Date();
      setDateFormatted(
        now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      );

      // Load Journals
      const { data: journals } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (journals && journals.length > 0) {
        setStreakCount(getJournalStreak(journals.map((journal: any) => journal.date || journal.created_at)));
        setPosts(
          journals.map((j: any) => {
            const d = new Date(j.created_at || j.date);
            const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
            const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
            const parsed = parseJournalContent(j.content);

            return {
              id: j.id,
              dayNumber: getJourneyDayForDate(j.date || j.created_at, profile?.start_date),
              dateStr,
              timeStr,
              location: j.location || profile?.location || "Jakarta",
              userFullName: fName,
              userAvatar: fName.charAt(0).toUpperCase(),
              content: parsed.reflection,
              pelajaran: parsed.lesson,
              perbaikanBesok: parsed.improvement,
              mood: j.mood || "Bersyukur",
              isLiked: j.is_favorite || false,
              likeCount: j.is_favorite ? 1 : 0,
            };
          })
        );
      } else {
        // Empty state — tidak ada data jurnal (jangan tampilkan data palsu)
        setPosts([]);
        setStreakCount(0);
      }
    } catch (err) {
      console.error("Gagal memuat jurnal:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── SAVE REFLECTION ──────────────────────────────────────────────────────

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainReflection.trim()) return;

    setSaving(true);
    setSaveError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("Sesi login telah berakhir. Silakan login ulang.");
        return;
      }

      const now = new Date();
      const { data: profileTimeZone } = await supabase.from("profiles").select("timezone, timezone_mode").eq("user_id", user.id).maybeSingle();
      const resolvedTimeZone = resolveParticipantTimeZone(
        profileTimeZone?.timezone || DEFAULT_TIME_ZONE,
        profileTimeZone?.timezone_mode || "AUTO"
      );
      const todayStr = getLocalDateString(now, resolvedTimeZone);
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

      const combinedContent = composeJournalContent(mainReflection, pelajaran, perbaikanBesok);

      const existingToday = posts.find(post => post.dateStr === now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
      const journalPayload = {
        content: combinedContent,
        mood: selectedMood,
        is_private: true,
        location: userLocation,
      };
      const saveQuery = existingToday
        ? supabase.from("journals").update(journalPayload).eq("id", existingToday.id)
        : supabase.from("journals").insert({ user_id: user.id, date: todayStr, ...journalPayload });
      const { data, error } = await saveQuery.select().single();

      if (error) {
        console.error("Gagal menyimpan refleksi:", error);
        setSaveError(`Gagal menyimpan refleksi: ${error.message}`);
        return;
      }

      if (data) {
        const newPost: JournalPost = {
          id: data.id,
          dayNumber: getJourneyDayForDate(todayStr, journeyStartDate) || dayCount,
          dateStr: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
          timeStr,
          location: userLocation,
          userFullName: userName,
          userAvatar: userName.charAt(0).toUpperCase(),
          content: mainReflection.trim(),
          pelajaran: pelajaran.trim(),
          perbaikanBesok: perbaikanBesok.trim(),
          mood: selectedMood,
          isLiked: false,
          likeCount: 1,
        };

        setPosts(prev => [newPost, ...prev.filter(post => post.dateStr !== newPost.dateStr)]);
        setMainReflection("");
        setPelajaran("");
        setPerbaikanBesok("");
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Gagal menyimpan refleksi:", err);
      setSaveError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const toggleLikePost = async (id: string, currentLiked: boolean) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            isLiked: !currentLiked,
            likeCount: currentLiked ? p.likeCount - 1 : p.likeCount + 1,
          };
        }
        return p;
      })
    );
    const { error } = await supabase.from("journals").update({ is_favorite: !currentLiked }).eq("id", id);
    if (error) {
      setPosts(prev => prev.map(post => post.id === id ? { ...post, isLiked: currentLiked, likeCount: currentLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1) } : post));
      setSaveError("Status favorit belum tersimpan. Coba lagi.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-3 border-[#071A33] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/journal" pageTitle="Refleksi Hari Ini">
      <main className="w-full min-h-screen bg-[#FAF9F5] text-navy-950 font-sans pb-20">

        {/* ─── MAIN CONTENT WRAPPER (2-COLUMN: 75% LEFT / 25% RIGHT) ───────────── */}
        <div className="w-full pt-4 sm:pt-6 pb-28 sm:pb-20">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-7 items-start">

            {/* ─── LEFT COLUMN (75% / col-span-8 or col-span-9) ───────────────── */}
            <div className="xl:col-span-9 space-y-5 sm:space-y-7 w-full">
              
              {/* 1. CLEAN HERO BANNER WITH FULL ADAPTIVE TIME BACKGROUND */}
              <div
                className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 min-h-[200px] sm:min-h-[260px] flex flex-col justify-between overflow-hidden shadow-lg border border-white/20 text-white bg-cover transition-all duration-700"
                style={{
                  backgroundImage: `url('${adaptiveJournalBg}')`,
                  backgroundPosition: "center top",
                }}
              >
                {/* Dark Gradient Overlay for Optimal Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/60 pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px] sm:min-h-[220px] w-full space-y-4 sm:space-y-6">
                  
                  {/* TOP ROW: Sisi Kiri Atas (Hari ke-X) & Sisi Kanan Atas (Jam WIB 18:50 dengan titik dua berkedip) */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    {/* Sisi Kiri Atas: Hari ke-X */}
                    <div>
                      <span className="text-amber-300 font-extrabold bg-black/50 px-3 py-1 rounded-full border border-amber-300/30 text-xs sm:text-sm shadow-xs inline-block">
                        Hari ke-{dayCount} Journey
                      </span>
                    </div>

                    {/* Sisi Kanan Atas: Jam WIB 18:50 (WIB di kiri, titik dua berkedip) */}
                    <div className="flex items-center gap-1.5 text-right">
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-900 bg-amber-400 px-1.5 py-0.5 rounded shadow-2xs">
                        WIB
                      </span>
                      <div className="text-2xl sm:text-5xl font-black text-white font-mono tracking-tighter leading-none drop-shadow-lg flex items-center">
                        <span>{heroClockHH}</span>
                        <span className={`inline-block transition-opacity duration-200 ${showColon ? "opacity-100" : "opacity-20 text-amber-300"}`}>:</span>
                        <span>{heroClockMM}</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ROW: Sisi Kiri Bawah (Refleksi Hari Ini & Quote) & Sisi Kanan Bawah (Tanggal) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 w-full pt-1">
                    {/* Sisi Kiri Bawah: Judul & Quote */}
                    <div className="space-y-0.5 max-w-lg w-full text-left">
                      <h1 className="text-xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                        Refleksi Hari Ini
                      </h1>
                      <p className="text-[11px] sm:text-sm text-slate-100 italic font-serif leading-relaxed drop-shadow-sm">
                        &ldquo;Setiap langkah kecil yang ditulis akan lebih mudah menjadi kebiasaan.&rdquo;
                      </p>
                    </div>

                    {/* Sisi Kanan Bawah: Tanggal */}
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[11px] sm:text-sm font-semibold text-slate-200 drop-shadow-sm">
                        📅 {dateFormatted}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2. FORM REFLEKSI CARD */}
              <Card className="w-full bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xs space-y-5 sm:space-y-6 border border-slate-200/80">
                
                {/* ─── PANDUAN MUJAAHAH (COLLAPSIBLE) ─── */}
                <div className="bg-amber-50/70 rounded-2xl border border-amber-200/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowMujahadah(!showMujahadah)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                        Panduan Mujahadah
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-amber-600 transition-transform duration-200 ${showMujahadah ? "rotate-180" : ""}`} />
                  </button>
                  {showMujahadah && (
                    <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 space-y-2 text-xs text-amber-900 border-t border-amber-200/40 pt-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-700 shrink-0">1.</span>
                        <span>Apa pelajaran terbesar yang Allah tunjukkan kepada saya selama perjalanan ini?</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-700 shrink-0">2.</span>
                        <span>Apa hal-hal yang bisa saya lakukan lebih baik bila ada kesempatan kembali?</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-700 shrink-0">3.</span>
                        <span>Apa amal atau kebiasaan yang akan saya perjuangkan sepulang dari Tanah Suci?</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* SECTION: CERITAKAN PERJALANANMU HARI INI */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                      <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-[#071A33] uppercase tracking-wider">
                      Ceritakan perjalananmu hari ini
                    </h3>
                  </div>

                  <div className="relative">
                    <Textarea
                      rows={4}
                      maxLength={1000}
                      value={mainReflection}
                      onChange={e => setMainReflection(e.target.value)}
                      placeholder="Tulis refleksi, rasa syukur, hikmah, atau hal yang ingin kamu pelajari..."
                      className="text-xs sm:text-sm leading-relaxed border-slate-200 focus:border-amber-500 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 placeholder:text-slate-400 placeholder:italic font-serif bg-white"
                    />
                    <span className="absolute right-3.5 bottom-3 text-[10px] font-mono text-slate-400">
                      {mainReflection.length}/1000
                    </span>
                  </div>
                </div>

                {/* SECTION 3: HARI INI SAYA MERASA (5 MOOD CARDS GRID) */}
                <div className="space-y-3 border-t border-slate-100 pt-4 sm:pt-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                        <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <h3 className="text-xs font-extrabold text-[#071A33] uppercase tracking-wider">
                        Hari ini saya merasa
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 ml-8 sm:ml-9.5">
                      Pilih satu yang paling menggambarkan perasaan Anda.
                    </p>
                  </div>

                  {/* 5 Mood Cards */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
                    {MOOD_ITEMS.map((m) => {
                      const isSelected = selectedMood === m.label;
                      return (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => setSelectedMood(m.label)}
                          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                            isSelected
                              ? "bg-[#FFFDF3] border-amber-400 text-amber-950 font-bold shadow-2xs scale-102"
                              : "bg-white border-slate-100 hover:border-slate-200 text-slate-600 font-medium"
                          }`}
                        >
                          <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 flex items-center justify-center text-xs ${m.colorClass}`}>
                            {m.emoji}
                          </div>
                          <span className="text-[11px] sm:text-xs truncate w-full text-center">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── PANDUAN ISTIQAMAH (HARI KE-90 SAJA) ─── */}
                {dayCount >= 90 && (
                  <div className="bg-amber-50/70 rounded-2xl border border-amber-200/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowIstiqamah(!showIstiqamah)}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider truncate">
                          Panduan Istiqamah — Refleksi 90 Hari
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-amber-600 transition-transform duration-200 ${showIstiqamah ? "rotate-180" : ""}`} />
                    </button>
                    {showIstiqamah && (
                      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 space-y-2 text-xs text-amber-900 border-t border-amber-200/40 pt-3">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-amber-700 shrink-0">1.</span>
                          <span>Perubahan apa yang sudah mulai saya rasakan setelah Umrah? Apa saja dampak perubahan ini terhadap diri, pekerjaan, lingkungan saya?</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-amber-700 shrink-0">2.</span>
                          <span>Apa tantangan terbesar yang dapat melemahkan komitmen saya?</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-amber-700 shrink-0">3.</span>
                          <span>Apa kebiasaan yang akan saya jaga agar perubahan ini tetap hidup sepanjang perjalanan saya?</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 4 & 5: PELAJARAN & PERBAIKAN BESOK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 border-t border-slate-100 pt-4 sm:pt-5">
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <h3 className="text-xs font-extrabold text-[#071A33] uppercase tracking-wider">
                          Pelajaran hari ini
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 ml-8 sm:ml-9.5">
                        Apa yang bisa Anda ambil dari hari ini?
                      </p>
                    </div>

                    <div className="relative">
                      <Textarea
                        rows={2}
                        maxLength={500}
                        value={pelajaran}
                        onChange={e => setPelajaran(e.target.value)}
                        placeholder="Tuliskan pelajaran atau hikmah..."
                        className="text-xs border-slate-200 focus:border-amber-500 rounded-xl p-3 placeholder:text-slate-400 placeholder:italic font-serif bg-white"
                      />
                      <span className="absolute right-3.5 bottom-2 text-[10px] font-mono text-slate-400">
                        {pelajaran.length}/500
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <h3 className="text-xs font-extrabold text-[#071A33] uppercase tracking-wider">
                          Apa yang ingin diperbaiki besok?
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 ml-8 sm:ml-9.5">
                        Langkah kecil apa yang akan dilakukan?
                      </p>
                    </div>

                    <div className="relative">
                      <Textarea
                        rows={2}
                        maxLength={500}
                        value={perbaikanBesok}
                        onChange={e => setPerbaikanBesok(e.target.value)}
                        placeholder="Tuliskan komitmen perbaikan..."
                        className="text-xs border-slate-200 focus:border-amber-500 rounded-xl p-3 placeholder:text-slate-400 placeholder:italic font-serif bg-white"
                      />
                      <span className="absolute right-3.5 bottom-2 text-[10px] font-mono text-slate-400">
                        {perbaikanBesok.length}/500
                      </span>
                    </div>
                  </div>

                </div>

                {/* ERROR ALERT */}
                {saveError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                    <X className="h-4 w-4 text-rose-500 shrink-0" />
                    {saveError}
                    <button onClick={() => setSaveError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* FOOTER BAR */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:pt-5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      Jurnal ini bersifat privat dan terenkripsi.
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      📍 {userLocation}
                    </span>
                  </div>

                  <Button
                    onClick={handleSaveReflection}
                    disabled={saving || !mainReflection.trim()}
                    className="w-full sm:w-auto bg-[#071A33] hover:bg-slate-900 text-amber-300 font-extrabold text-xs rounded-xl h-11 px-8 shadow-xs flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      "Menyimpan..."
                    ) : savedSuccess ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        Tersimpan!
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Simpan Refleksi Hari Ini
                      </>
                    )}
                  </Button>
                </div>

              </Card>

            </div>

            {/* ─── RIGHT COLUMN INSTAGRAM FEED GRID ─── */}
            <div className="xl:col-span-3 space-y-4 w-full pt-4 xl:pt-0">
              
              {/* Header Section */}
              <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
                <div className="h-7 w-7 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                  <Flame className="h-4 w-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-[#071A33] uppercase tracking-wider">
                    Riwayat Refleksi
                  </h3>
                  <p className="text-[11px] text-slate-400">Refleksi Harian Anda</p>
                </div>
              </div>

              {/* Instagram Feed Grid (2-Columns on Mobile, 3-Columns on Desktop) */}
              {posts.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="h-14 w-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Belum ada refleksi</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                    Mulai tulis refleksi pertamamu hari ini di kolom sebelah kiri.
                  </p>
                </div>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all text-left group relative overflow-hidden"
                  >
                    {/* Top: Day Tag */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-black text-[#071A33] leading-none">
                        H-{post.dayNumber}
                      </span>
                      <span className="text-[11px]">
                        {MOOD_ITEMS.find(m => m.label === post.mood)?.emoji || "😊"}
                      </span>
                    </div>

                    {/* Middle Excerpt */}
                    <p className="text-[10px] text-slate-600 italic font-serif line-clamp-2 leading-tight my-auto">
                      &ldquo;{post.content}&rdquo;
                    </p>

                    {/* Bottom: Heart / Action */}
                    <div className="flex items-center justify-between w-full text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-0.5 text-rose-500 font-bold">
                        <Heart className="h-2.5 w-2.5 fill-rose-500" />
                        {post.likeCount}
                      </span>
                      <span className="font-extrabold text-amber-800 group-hover:underline">
                        Lihat
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              )}

            </div>

          </div>
        </div>

        {/* ─── POST DETAIL MODAL (WHEN INSTAGRAM CARD IS CLICKED) ─────────── */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="sm:max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 font-sans">
              
              <DialogHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-[#071A33] text-amber-300 font-bold text-xs flex items-center justify-center">
                      {selectedPost.userAvatar}
                    </div>
                    <div>
                      <DialogTitle className="text-sm font-black text-[#071A33]">
                        Refleksi Hari ke-{selectedPost.dayNumber}
                      </DialogTitle>
                      <DialogDescription className="text-[11px] text-slate-400">
                        {selectedPost.dateStr} • {selectedPost.timeStr} • 📍 {selectedPost.location}
                      </DialogDescription>
                    </div>
                  </div>

                  <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs font-bold">
                    {selectedPost.mood}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Cerita Perjalanan:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-serif italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    &ldquo;{selectedPost.content}&rdquo;
                  </p>
                </div>

                {selectedPost.pelajaran && (
                  <div className="space-y-1 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                    <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-amber-700" /> Pelajaran Hari Ini:
                    </span>
                    <p className="text-slate-700 italic font-serif leading-relaxed">
                      {selectedPost.pelajaran}
                    </p>
                  </div>
                )}

                {selectedPost.perbaikanBesok && (
                  <div className="space-y-1 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                    <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-emerald-700" /> Rencana Perbaikan Besok:
                    </span>
                    <p className="text-slate-700 italic font-serif leading-relaxed">
                      {selectedPost.perbaikanBesok}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-slate-100 pt-3">
                <Button
                  onClick={() => setSelectedPost(null)}
                  className="bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-9 px-6 w-full"
                >
                  Tutup Refleksi
                </Button>
              </DialogFooter>

            </DialogContent>
          </Dialog>
        )}

      </main>
    </ParticipantLayout>
  );
}
