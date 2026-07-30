"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import {
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Zap,
  Award,
  Globe,
  Activity,
  Users,
  Compass,
  Plus,
  X,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Star,
  Info,
  Check,
  Clock,
  Edit3,
  Heart,
} from "lucide-react";

// ─── Section Config ─────────────────────────────────────────────
const SECTIONS = [
  { num: 1, title: "Hasil Muhasabah", subtitle: "Insight terbesar tentang diri Anda" },
  { num: 2, title: "Niat Perubahan", subtitle: "Landasan komitmen ibadah karena Allah" },
  { num: 3, title: "Area Transformasi", subtitle: "Pilih maksimal 3 area fokus pertumbuhan" },
  { num: 4, title: "Sasaran & Indikator Capaian", subtitle: "Sasaran 90 hari & 4 dimensi indikator terukur" },
  { num: 5, title: "Action Plan (Habit Engine)", subtitle: "Kebiasaan harian/mingguan yang dipantau" },
  { num: 6, title: "Tim Pendukung", subtitle: "Sahabat Safar (Akuntabilitas Mutual)" },
];

// ─── Area List ───────────────────────────────────────────────────
const AREA_LIST = [
  { id: "Spiritual Growth", icon: Compass, label: "Spiritual Growth", desc: "Kedisiplinan ibadah & kedekatan dengan Allah", sel: "border-amber-600 bg-amber-600 text-white shadow-sm", base: "border-slate-200 bg-white text-slate-700 hover:border-amber-300" },
  { id: "Personal Development", icon: Zap, label: "Personal Development", desc: "Integritas, kesabaran & kontrol emosi", sel: "border-blue-600 bg-blue-600 text-white shadow-sm", base: "border-slate-200 bg-white text-slate-700 hover:border-blue-300" },
  { id: "Leadership Excellence", icon: Award, label: "Leadership/Profesional Excellence", desc: "Etos kerja & keteladanan dalam karir", sel: "border-[#071A33] bg-[#071A33] text-white shadow-sm", base: "border-slate-200 bg-white text-slate-700 hover:border-slate-400" },
  { id: "Family Bonding", icon: Users, label: "Family Bonding", desc: "Keharmonisan & komunikasi keluarga", sel: "border-rose-600 bg-rose-600 text-white shadow-sm", base: "border-slate-200 bg-white text-slate-700 hover:border-rose-300" },
  { id: "Community Impact", icon: Globe, label: "Community Impact", desc: "Kebermanfaatan sosial & dakwah", sel: "border-emerald-600 bg-emerald-600 text-white shadow-sm", base: "border-slate-200 bg-white text-slate-700 hover:border-emerald-300" },
  { id: "Health & Wellbeing", icon: Activity, label: "Health & Wellbeing", desc: "Kesehatan fisik & mental yang optimal", sel: "border-teal-600 bg-teal-600 text-white shadow-sm", base: "border-slate-200 bg-white text-slate-700 hover:border-teal-300" },
];

// ─── Habit Icon Detector ─────────────────────────────────────────
function getHabitStyle(title: string): { bg: string; iconColor: string; Icon: React.ElementType } {
  const t = title.toLowerCase();
  if (t.includes("tahajud") || t.includes("tahajjud")) return { bg: "bg-indigo-100", iconColor: "text-indigo-600", Icon: Moon };
  if (t.includes("sholat") || t.includes("salat") || t.includes("dhuha") || t.includes("duha")) return { bg: "bg-amber-100", iconColor: "text-amber-600", Icon: Sun };
  if (t.includes("quran") || t.includes("qur'an") || t.includes("tilawah") || t.includes("tadarus")) return { bg: "bg-teal-100", iconColor: "text-teal-600", Icon: BookOpen };
  if (t.includes("dzikir") || t.includes("wirid") || t.includes("doa")) return { bg: "bg-purple-100", iconColor: "text-purple-600", Icon: Sparkles };
  if (t.includes("olahraga") || t.includes("gym") || t.includes("lari") || t.includes("senam") || t.includes("ringan")) return { bg: "bg-green-100", iconColor: "text-green-600", Icon: Activity };
  if (t.includes("hadist") || t.includes("hadith") || t.includes("hadis")) return { bg: "bg-orange-100", iconColor: "text-orange-600", Icon: BookOpen };
  return { bg: "bg-slate-100", iconColor: "text-slate-500", Icon: Star };
}

// ─── Tips Data ───────────────────────────────────────────────────
const SECTION_TIPS: Record<number, { title: string; tips: { icon: string; title: string; desc: string }[]; example?: string }> = {
  1: {
    title: "Tips Menulis Muhasabah",
    tips: [
      { icon: "✦", title: "Jujur kepada diri sendiri", desc: "Tidak ada yang benar atau salah, ini ruang untuk refleksi." },
      { icon: "✦", title: "Fokus pada perubahan", desc: "Tulis hal yang bisa Anda kendalikan dan ubah." },
      { icon: "✦", title: "Spesifik dan mendalam", desc: "Semakin spesifik, semakin mudah diukur progresnya." },
    ],
    example: "\"Saya sering menunda ibadah penting karena merasa tidak punya waktu. Saya ingin menjadi pribadi yang lebih disiplin dan konsisten dalam beribadah kepada Allah.\"",
  },
  2: {
    title: "Tips Menulis Niat",
    tips: [
      { icon: "✦", title: "Awali dengan Bismillah", desc: "Mulai niat dengan nama Allah agar terjaga keikhlasannya." },
      { icon: "✦", title: "Tuliskan motivasi terdalam", desc: "Mengapa perubahan ini penting bagi Anda dan orang sekitar." },
      { icon: "✦", title: "Niat yang spesifik bertahan lebih lama", desc: "Niat yang jelas lebih mudah diingat di saat-saat sulit." },
    ],
  },
  3: {
    title: "Tips Memilih Area",
    tips: [
      { icon: "✦", title: "Fokus adalah kunci", desc: "3 area maksimal agar energi tidak tersebar terlalu luas." },
      { icon: "✦", title: "Pilih yang relevan sekarang", desc: "Pilih area yang paling berdampak pada kondisi Anda saat ini." },
      { icon: "✦", title: "Area bisa berubah tiap batch", desc: "Setiap siklus 90 hari Anda bisa memilih area yang berbeda." },
    ],
  },
  4: {
    title: "Tips Target & Indikator",
    tips: [
      { icon: "✦", title: "1 target besar, bukan banyak", desc: "Satu target utama yang jelas lebih powerful dari banyak target kabur." },
      { icon: "✦", title: "Indikator harus bisa diukur", desc: "Gunakan angka, frekuensi, atau periode waktu yang konkret." },
      { icon: "✦", title: "Target SMART", desc: "Specific · Measurable · Achievable · Relevant · Time-bound." },
    ],
  },
  5: {
    title: "Tips Habit Engine",
    tips: [
      { icon: "✦", title: "Mulai dari yang kecil", desc: "Kebiasaan kecil yang konsisten lebih efektif dari yang besar tapi tidak dilakukan." },
      { icon: "✦", title: "Harian lebih baik dari mingguan", desc: "Frekuensi tinggi membangun otot kebiasaan lebih cepat." },
      { icon: "✦", title: "Kaitkan dengan area transformasi", desc: "Pilih kebiasaan yang langsung mendukung area yang dipilih." },
    ],
  },
  6: {
    title: "Tips Tim Pendukung",
    tips: [
      { icon: "✦", title: "Pilih yang berkomitmen", desc: "Sahabat Safar yang juga ingin berubah akan lebih efektif." },
      { icon: "✦", title: "Sepakati jadwal check-in", desc: "Minimal seminggu sekali untuk saling berbagi progres." },
      { icon: "✦", title: "Saling doakan", desc: "Doa untuk saudara adalah ibadah yang paling ringan namun bermakna." },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function JourneyPage() {
  const router = useRouter();
  const supabase = createClient();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Profile
  const [userName, setUserName] = useState("Peserta SLJ");
  const [startDate, setStartDate] = useState("-");
  const [endDate, setEndDate] = useState("-");
  const [coachName, setCoachName] = useState("Ditunjuk oleh Admin");
  const [dayCount, setDayCount] = useState(1);

  // Journey
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const journeyIdRef = useRef<string | null>(null);
  const [ptpStatus, setPtpStatus] = useState<"EDITABLE" | "LOCKED">("EDITABLE");
  const ptpStatusRef = useRef<"EDITABLE" | "LOCKED">("EDITABLE");
  const [loading, setLoading] = useState(true);

  // UI
  const [activeSection, setActiveSection] = useState(1);
  const [mobileView, setMobileView] = useState<"navigator" | "editor" | "tips">("navigator");
  const [showCelebration, setShowCelebration] = useState(false);

  // Autosave
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

interface AreaTargetData {
  mainTarget: string;
  targetAlasan: string;
  kualitas: string;
  kuantitas: string;
  kuantitasBaseline?: string;
  waktu: string;
  biaya: string;
}

interface BatchMate {
  userId: string;
  fullName: string;
}

  // ─── Ref mirrors for stale-closure-safe autosave ───────────────
  const muhasabahRef = useRef("");
  const niatRef = useRef("");
  const niatAlasanRef = useRef("");
  const selectedAreasRef = useRef<string[]>(["Spiritual Growth"]);
  const areaTargetsMapRef = useRef<Record<string, AreaTargetData>>({});
  const actionPlansRef = useRef<{ id?: string; title: string; frequency: string; quantity: number; area_category: string }[]>([]);
  const sahabatSafarRef = useRef("");
  const sahabatSafarUserIdRef = useRef<string | null>(null);
  const coachNameRef = useRef("Ditunjuk oleh Admin");

  // Section 1
  const [muhasabah, setMuhasabah] = useState("");

  // Section 2
  const [niat, setNiat] = useState("");
  const [niatAlasan, setNiatAlasan] = useState("");

  // Section 3
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Spiritual Growth"]);

  // Section 4 (Tab Per Area)
  const [activeAreaTab, setActiveAreaTab] = useState<string>("Spiritual Growth");
  const [areaTargetsMap, setAreaTargetsMap] = useState<Record<string, AreaTargetData>>({
    "Spiritual Growth": { mainTarget: "", targetAlasan: "", kualitas: "", kuantitas: "", kuantitasBaseline: "", waktu: "", biaya: "" }
  });

  // SMART Tooltip State
  const [showSmartTooltip, setShowSmartTooltip] = useState(false);

  // Section 5
  const [actionPlans, setActionPlans] = useState<{ id?: string; title: string; frequency: string; quantity: number; area_category: string }[]>([]);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionFreq, setNewActionFreq] = useState<string>("Harian");
  const [newActionQty, setNewActionQty] = useState<number>(1);
  const [newActionArea, setNewActionArea] = useState<string>("Spiritual Growth");
  const [showAddHabit, setShowAddHabit] = useState(false);

  // Section 6
  const [sahabatSafar, setSahabatSafar] = useState("");
  const [sahabatSafarUserId, setSahabatSafarUserId] = useState<string | null>(null);
  const [batchMates, setBatchMates] = useState<BatchMate[]>([]);

  // ─── Data Loading ──────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
        const { data: journey } = await supabase.from("journeys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

        if (profile?.program_code) {
          // Fetch batch mates for Sahabat Safar selection
          const { data: mates } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .eq("program_code", profile.program_code)
            .neq("user_id", user.id);
          if (mates) {
            setBatchMates(mates.map(m => ({ userId: m.user_id, fullName: m.full_name })));
          }
        }

        if (profile?.role === "participant" || !profile?.role) {
          if (!profile?.program_code || journey?.status === "ONBOARDING" || !journey) {
            router.replace("/onboarding");
            return;
          }
        }

        if (profile) {
          setUserName(profile.full_name || user.email || "Peserta SLJ");
          if (profile.start_date) {
            const startD = new Date(profile.start_date);
            setStartDate(startD.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
            const diff = Math.floor((Date.now() - startD.getTime()) / 86400000);
            setDayCount(Math.max(1, diff + 1));
          }
          if (profile.end_date) {
            setEndDate(new Date(profile.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
          }
        }

        if (journey) {
          setJourneyId(journey.id);
          setPtpStatus((journey.ptp_status as "EDITABLE" | "LOCKED") || "EDITABLE");
          setMuhasabah(journey.muhasabah || "");

          // Niat: try parse as JSON (new format) or plain text (legacy)
          try {
            const nd = JSON.parse(journey.niat || "{}");
            setNiat(typeof nd === "object" ? (nd.niat || "") : journey.niat || "");
            setNiatAlasan(typeof nd === "object" ? (nd.alasan || "") : "");
          } catch { setNiat(journey.niat || ""); }

          if (Array.isArray(journey.area_transformasi) && journey.area_transformasi.length > 0) {
            setSelectedAreas(journey.area_transformasi);
            setActiveAreaTab(journey.area_transformasi[0]);
            setNewActionArea(journey.area_transformasi[0]);
          }

          // Target & Indicators per area parsing
          try {
            const parsedTargets = JSON.parse(journey.main_target || "{}");
            if (parsedTargets && typeof parsedTargets === "object" && !parsedTargets.target) {
              setAreaTargetsMap(parsedTargets);
            } else if (parsedTargets.target) {
              // Legacy format fallback
              setAreaTargetsMap({
                [selectedAreas[0] || "Spiritual Growth"]: {
                  mainTarget: parsedTargets.target || "",
                  targetAlasan: parsedTargets.alasan || "",
                  kualitas: journey.success_indicators?.[0] || "",
                  kuantitas: journey.success_indicators?.[1] || "",
                  waktu: journey.success_indicators?.[2] || "",
                  biaya: "",
                }
              });
            }
          } catch {
            setAreaTargetsMap({
              [selectedAreas[0] || "Spiritual Growth"]: {
                mainTarget: journey.main_target || "",
                targetAlasan: "",
                kualitas: journey.success_indicators?.[0] || "",
                kuantitas: journey.success_indicators?.[1] || "",
                waktu: journey.success_indicators?.[2] || "",
                biaya: "",
              }
            });
          }

          // Action Plans
          const { data: plans } = await supabase.from("action_plans").select("id, title, frequency, quantity, category").eq("journey_id", journey.id);
          if (plans && plans.length > 0) {
            setActionPlans(plans.map(p => ({
              id: p.id,
              title: p.title,
              frequency: p.frequency || "Harian",
              quantity: p.quantity || 1,
              area_category: p.category || selectedAreas[0] || "Spiritual Growth",
            })));
          } else {
            const { data: uh } = await supabase.from("habits").select("id, title, frequency, quantity, category").eq("user_id", user.id).eq("is_archived", false);
            if (uh && uh.length > 0) {
              setActionPlans(uh.map(h => ({
                id: h.id,
                title: h.title,
                frequency: h.frequency || "Harian",
                quantity: h.quantity || 1,
                area_category: h.category || selectedAreas[0] || "Spiritual Growth",
              })));
            }
          }

          // Support Team
          try {
            const { data: team } = await supabase.from("support_team").select("coach_name, sahabat_safar_name, sahabat_safar_user_id").eq("journey_id", journey.id).maybeSingle();
            if (team?.coach_name) setCoachName(team.coach_name);
            if (team?.sahabat_safar_name) setSahabatSafar(team.sahabat_safar_name);
            if (team?.sahabat_safar_user_id) setSahabatSafarUserId(team.sahabat_safar_user_id);
          } catch {}
        }
      } catch (err) { console.log("Journey load error:", err); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  // ─── Keep refs in sync with latest state (fixes stale closure in setTimeout) ─
  useEffect(() => { muhasabahRef.current = muhasabah; }, [muhasabah]);
  useEffect(() => { niatRef.current = niat; }, [niat]);
  useEffect(() => { niatAlasanRef.current = niatAlasan; }, [niatAlasan]);
  useEffect(() => { selectedAreasRef.current = selectedAreas; }, [selectedAreas]);
  useEffect(() => { areaTargetsMapRef.current = areaTargetsMap; }, [areaTargetsMap]);
  useEffect(() => { actionPlansRef.current = actionPlans; }, [actionPlans]);
  useEffect(() => { sahabatSafarRef.current = sahabatSafar; }, [sahabatSafar]);
  useEffect(() => { sahabatSafarUserIdRef.current = sahabatSafarUserId; }, [sahabatSafarUserId]);
  useEffect(() => { coachNameRef.current = coachName; }, [coachName]);
  useEffect(() => { journeyIdRef.current = journeyId; }, [journeyId]);
  useEffect(() => { ptpStatusRef.current = ptpStatus; }, [ptpStatus]);

  // ─── Autosave ──────────────────────────────────────────────────
  const scheduleAutosave = (sectionNum: number) => {
    if (ptpStatusRef.current === "LOCKED") return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // Store sectionNum in the closure, but read field values from refs at fire time
    saveTimerRef.current = setTimeout(() => handleSaveSection(sectionNum), 1500);
  };

  const handleSaveSection = async (sectionNum: number) => {
    // Always read from refs — guarantees latest value even if called from stale closure
    const _journeyId = journeyIdRef.current;
    const _ptpStatus = ptpStatusRef.current;
    if (_ptpStatus === "LOCKED" || !_journeyId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const todayStr = new Date().toISOString().split("T")[0];

      switch (sectionNum) {
        case 1:
          await supabase.from("journeys").update({ muhasabah: muhasabahRef.current, updated_at: new Date().toISOString() }).eq("id", _journeyId);
          break;
        case 2:
          await supabase.from("journeys").update({ niat: JSON.stringify({ niat: niatRef.current, alasan: niatAlasanRef.current }), updated_at: new Date().toISOString() }).eq("id", _journeyId);
          break;
        case 3:
          await supabase.from("journeys").update({ area_transformasi: selectedAreasRef.current, updated_at: new Date().toISOString() }).eq("id", _journeyId);
          break;
        case 4: {
          const targetsObj = areaTargetsMapRef.current;
          const jsonStr = JSON.stringify(targetsObj);
          const allIndicators = Object.values(targetsObj).flatMap(t => [t.kualitas, t.kuantitas, t.waktu, t.biaya].filter(b => b && b.trim() !== ""));
          await supabase.from("journeys").update({ main_target: jsonStr, success_indicators: allIndicators, updated_at: new Date().toISOString() }).eq("id", _journeyId);
          break;
        }
        case 5: {
          const _plans = actionPlansRef.current;
          await supabase.from("action_plans").delete().eq("journey_id", _journeyId);
          for (const ap of _plans) {
            const { data: apData } = await supabase.from("action_plans").insert({ journey_id: _journeyId, user_id: user.id, title: ap.title, category: ap.area_category || "Spiritual Growth", frequency: ap.frequency, quantity: ap.quantity || 1 }).select().maybeSingle();
            const { data: existing } = await supabase.from("habits").select("id").eq("user_id", user.id).eq("title", ap.title).eq("is_archived", false).maybeSingle();
            if (!existing) await supabase.from("habits").insert({ user_id: user.id, action_plan_id: apData?.id || null, title: ap.title, category: ap.area_category || "Spiritual Growth", frequency: ap.frequency, quantity: ap.quantity || 1, source: "action_plan", effective_from: todayStr, is_archived: false });
          }
          break;
        }
        case 6:
          await supabase.from("support_team").upsert({
            journey_id: _journeyId,
            user_id: user.id,
            sahabat_safar_name: sahabatSafarRef.current,
            sahabat_safar_user_id: sahabatSafarUserIdRef.current,
          });
          break;
      }
      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err) { console.error("Save error:", err); setSaveStatus("idle"); }
  };

  // ─── Helpers ───────────────────────────────────────────────────
  const isSectionComplete = (num: number) => {
    switch (num) {
      case 1: return muhasabah.trim().length > 0;
      case 2: return niat.trim().length > 0;
      case 3: return selectedAreas.length > 0;
      case 4: return Object.values(areaTargetsMap).some(t => t.mainTarget && t.mainTarget.trim().length > 0);
      case 5: return actionPlans.length > 0;
      case 6: return sahabatSafar.trim().length > 0;
      default: return false;
    }
  };

  const completedCount = SECTIONS.filter((_, i) => isSectionComplete(i + 1)).length;
  const progressPct = Math.round((completedCount / 6) * 100);
  const estimatedMinutes = (6 - completedCount) * 8;

  const getSectionStatus = (num: number): "completed" | "in-progress" | "not-started" => {
    if (isSectionComplete(num)) return "completed";
    if (num === activeSection) return "in-progress";
    return "not-started";
  };

  const getLastSavedText = () => {
    if (!lastSaved) return "";
    const diff = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
    if (diff < 1) return "baru saja";
    if (diff < 60) return `${diff} menit yang lalu`;
    return lastSaved.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleArea = (id: string) => {
    if (ptpStatus === "LOCKED") return;
    let next: string[];
    if (selectedAreas.includes(id)) { next = selectedAreas.filter(a => a !== id); }
    else { if (selectedAreas.length >= 3) return; next = [...selectedAreas, id]; }
    setSelectedAreas(next);
    scheduleAutosave(3);
  };

  const addActionPlan = () => {
    if (ptpStatus === "LOCKED" || !newActionTitle.trim()) return;
    const next = [...actionPlans, { id: String(Date.now()), title: newActionTitle.trim(), frequency: newActionFreq, quantity: Number(newActionQty) || 1, area_category: newActionArea }];
    setActionPlans(next);
    setNewActionTitle("");
    setShowAddHabit(false);
    scheduleAutosave(5);
  };

  const removeActionPlan = (idx: number) => {
    if (ptpStatus === "LOCKED") return;
    const next = actionPlans.filter((_, i) => i !== idx);
    setActionPlans(next);
    scheduleAutosave(5);
  };

  const goToNext = () => {
    if (activeSection < 6) { setActiveSection(activeSection + 1); setMobileView("editor"); }
    else { setShowCelebration(true); }
  };

  const goToPrev = () => {
    if (activeSection > 1) { setActiveSection(activeSection - 1); setMobileView("editor"); }
    else { setMobileView("navigator"); }
  };

  // ─── Autosave Indicator ────────────────────────────────────────
  const SaveIndicator = () => (
    <div className="flex items-center gap-1.5 text-xs">
      {saveStatus === "saving" ? (
        <><div className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse" /><span className="text-slate-400">Menyimpan...</span></>
      ) : saveStatus === "saved" ? (
        <><div className="h-1.5 w-1.5 bg-green-500 rounded-full" /><span className="text-slate-400">Tersimpan otomatis {getLastSavedText()}</span></>
      ) : (
        <><div className="h-1.5 w-1.5 bg-slate-200 rounded-full" /><span className="text-slate-300">Siap disimpan</span></>
      )}
    </div>
  );

  // ─── Section Content ───────────────────────────────────────────
  const renderSectionContent = (sectionNum: number) => {
    const locked = ptpStatus === "LOCKED";
    switch (sectionNum) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">✦</span>
                  <span className="text-sm font-bold text-amber-800">Reflection Guide</span>
                </div>
              </div>
              <ul className="text-sm text-amber-900 space-y-1">
                <li>• Apa hal terpenting yang paling ingin Anda ubah dalam 90 hari?</li>
                <li>• Apa kebiasaan yang paling sering menghambat potensi Anda?</li>
                <li>• Apa yang ingin Allah lihat berubah dari diri Anda?</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-slate-700 mb-2 font-medium">Tuliskan Muhasabah diri Anda secara jujur dan mendalam.</p>
              <Textarea disabled={locked} value={muhasabah} onChange={e => { setMuhasabah(e.target.value); scheduleAutosave(1); }} placeholder="Tulis di sini..." className="min-h-[160px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl" maxLength={2000} />
              <div className="text-right text-xs text-slate-400 mt-1">{muhasabah.length} / 2000</div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-slate-400">💬</span>
                <span className="text-xs font-bold text-slate-600">Catatan untuk Coach (opsional)</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">Catatan ini hanya dapat dilihat oleh Coach dan Admin.</p>
              <Textarea disabled={locked} placeholder="Tulis catatan untuk Coach..." className="min-h-[80px] text-sm resize-none border-slate-200 rounded-lg bg-white" maxLength={500} />
              <div className="text-right text-xs text-slate-400 mt-1">0 / 500</div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 text-xl leading-none mt-0.5">&ldquo;</span>
                <div>
                  <p className="text-sm text-amber-900 italic leading-relaxed font-medium">Sesungguhnya amal itu bergantung pada niatnya, dan sesungguhnya setiap orang akan mendapatkan sesuai dengan apa yang ia niatkan.</p>
                  <p className="text-xs text-amber-700 mt-1.5 font-semibold">(HR. Bukhari & Muslim)</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1.5">Tulis niat perubahan Anda dengan jelas.</p>
              <Textarea disabled={locked} value={niat} onChange={e => { setNiat(e.target.value); scheduleAutosave(2); }} placeholder="Tulis niat Anda di sini..." className="min-h-[120px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl" maxLength={1000} />
              <div className="text-right text-xs text-slate-400 mt-1">{niat.length} / 1000</div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1.5">Mengapa niat ini penting bagi Anda?</p>
              <Textarea disabled={locked} value={niatAlasan} onChange={e => { setNiatAlasan(e.target.value); scheduleAutosave(2); }} placeholder="Tulis alasan Anda..." className="min-h-[80px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl" maxLength={500} />
              <div className="text-right text-xs text-slate-400 mt-1">{niatAlasan.length} / 500</div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Pilih maksimal <span className="font-bold text-amber-600">3 area</span> fokus pertumbuhan.</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${selectedAreas.length >= 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{selectedAreas.length}/3</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AREA_LIST.map(area => {
                const Icon = area.icon;
                const isSelected = selectedAreas.includes(area.id);
                return (
                  <button key={area.id} onClick={() => toggleArea(area.id)} disabled={locked || (!isSelected && selectedAreas.length >= 3)}
                    className={`relative flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${isSelected ? area.sel : area.base} ${!isSelected && selectedAreas.length >= 3 ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}`}>
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm block">{area.label}</span>
                      <span className={`text-xs block mt-0.5 ${isSelected ? "text-white/90" : "text-slate-500 opacity-70"}`}>{area.desc}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 h-5 w-5 bg-white/30 rounded-full flex items-center justify-center text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 4: {
        const currentTargetData = areaTargetsMap[activeAreaTab] || { mainTarget: "", targetAlasan: "", kualitas: "", kuantitas: "", waktu: "", biaya: "" };
        const updateField = (field: keyof AreaTargetData, value: string) => {
          const updated = {
            ...areaTargetsMap,
            [activeAreaTab]: {
              ...currentTargetData,
              [field]: value,
            }
          };
          setAreaTargetsMap(updated);
          scheduleAutosave(4);
        };

        return (
          <div className="space-y-5">
            {/* Area Tabs Header */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">PILIH AREA BANYAK TARGET:</p>
              <div className="flex flex-wrap gap-2">
                {selectedAreas.map((areaId) => {
                  const areaObj = AREA_LIST.find(a => a.id === areaId);
                  const isActive = activeAreaTab === areaId;
                  return (
                    <button
                      key={areaId}
                      onClick={() => setActiveAreaTab(areaId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? "bg-[#0B2C6B] text-white border-[#0B2C6B] shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      {areaObj?.label || areaId}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area Target & Indicators Editor */}
            {(() => {
              const placeholdersByArea: Record<string, { sasaran: string; kualitas: string; kuantitasBaseline: string; kuantitasTarget: string; waktu: string; biaya: string }> = {
                "Spiritual Growth": {
                  sasaran: "Contoh: Konsisten sholat 5 waktu berjamaah di masjid & khatam Al-Qur'an 1 juz per minggu.",
                  kualitas: "Misal: Sholat khusyu, tumakninah & selesai dzikir sesudah salam...",
                  kuantitasBaseline: "Misal: 2 juz/bulan",
                  kuantitasTarget: "Misal: 4 juz/bulan (khatam 90 hari)",
                  waktu: "Misal: Hadir di masjid 10 menit sebelum adzan Subuh & Isya...",
                  biaya: "Misal: Sedekah subuh Rp 20.000 / hari via transfer/kotak masjid...",
                },
                "Personal Development": {
                  sasaran: "Contoh: Meningkatkan disiplin manajemen waktu, kontrol emosi, dan membaca 1 buku pengembangan diri per bulan.",
                  kualitas: "Misal: Mampu merespon masalah secara tenang tanpa emosi meluap...",
                  kuantitasBaseline: "Misal: 10 jam terbuang/minggu",
                  kuantitasTarget: "Misal: Maksimal 2 jam screen time non-produktif/hari",
                  waktu: "Misal: Alokasi waktu belajar/membaca jam 20:00 - 21:00 setiap malam...",
                  biaya: "Misal: Budget pembelian buku / webinar pengembangan diri Rp 300.000/bulan...",
                },
                "Leadership Excellence": {
                  sasaran: "Contoh: Menjadi teladan etos kerja tinggi, menyelesaikan proyek tim tepat waktu, dan aktif memberikan coaching staf.",
                  kualitas: "Misal: Memberikan arahan tugas yang jelas dan konstruktif kepada anggota tim...",
                  kuantitasBaseline: "Misal: 2 proyek terlambat",
                  kuantitasTarget: "Misal: 100% KPI proyek selesai sebelum deadline",
                  waktu: "Misal: Melakukan 1-on-1 coaching dengan tim 30 menit setiap hari Senin...",
                  biaya: "Misal: Alokasi apresiasi / apresiasi insentif tim Rp 500.000/bulan...",
                },
                "Family Bonding": {
                  sasaran: "Contoh: Membangun komunikasi hangat dalam keluarga, quality time harian, dan makan malam bersama tanpa gadget.",
                  kualitas: "Misal: Mendengarkan cerita pasangan dan anak secara penuh tanpa terdistraksi HP...",
                  kuantitasBaseline: "Misal: 1x quality time/bulan",
                  kuantitasTarget: "Misal: 4x weekend family gathering per bulan",
                  waktu: "Misal: No-gadget hour jam 18:30 - 20:00 bersama keluarga...",
                  biaya: "Misal: Budget rekreasi dan kuliner keluarga Rp 1.500.000/bulan...",
                },
                "Community Impact": {
                  sasaran: "Contoh: Aktif berkontribusi dalam kegiatan sosial masyarakat, berbagi ilmu, dan mendukung program pemberdayaan.",
                  kualitas: "Misal: Memberikan pendampingan warga secara tulus dan berkesinambungan...",
                  kuantitasBaseline: "Misal: 0 jam kegiatan sosial",
                  kuantitasTarget: "Misal: Mengajar / bakti sosial 4 jam setiap akhir pekan",
                  waktu: "Misal: Pelaksanaan pengabdian setiap hari Sabtu jam 09:00 - 11:00...",
                  biaya: "Misal: Donasi rutin program masyarakat Rp 500.000/bulan...",
                },
                "Health & Wellbeing": {
                  sasaran: "Contoh: Menjaga pola hidup sehat, tidur teratur 7 jam, olahraga rutin, dan mencapai berat badan ideal.",
                  kualitas: "Misal: Tubuh terasa bugar, stamina terjaga, dan pikiran segar saat bekerja...",
                  kuantitasBaseline: "Misal: 85 kg (BB awal)",
                  kuantitasTarget: "Misal: 75 kg (turun 10 kg dalam 90 hari)",
                  waktu: "Misal: Olahraga jogging / jalan cepat jam 06:00 - 06:45 setiap Selasa & Kamis...",
                  biaya: "Misal: Langganan gym / beli suplemen kesehatan Rp 400.000/bulan...",
                },
              };

              const currentPh = placeholdersByArea[activeAreaTab] || placeholdersByArea["Spiritual Growth"];

              return (
                <div className="bg-[#FAF8F4] border border-[#EAE5D9] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE5D9] pb-3">
                    <span className="text-xs font-extrabold text-[#0B2C6B] uppercase tracking-wider">
                      Target & Indikator: {activeAreaTab}
                    </span>
                  </div>

                  {/* Sasaran Utama with SMART Tooltip */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 relative">
                      <p className="text-sm font-bold text-slate-700">Sasaran Utama (90 Hari)</p>
                      <button
                        type="button"
                        onMouseEnter={() => setShowSmartTooltip(true)}
                        onMouseLeave={() => setShowSmartTooltip(false)}
                        onClick={() => setShowSmartTooltip(v => !v)}
                        className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                      {showSmartTooltip && (
                        <div className="absolute left-0 top-7 z-50 bg-navy-900 text-white text-xs rounded-xl p-3.5 shadow-xl w-64 border border-amber-400/30">
                          <p className="font-extrabold text-amber-300 mb-1">💡 Panduan Formulasi SMART:</p>
                          <p className="opacity-90 leading-relaxed text-[11px]">
                            <strong>S</strong>pecific · <strong>M</strong>easurable · <strong>A</strong>chievable · <strong>R</strong>elevant · <strong>T</strong>ime-bound.
                          </p>
                          <p className="mt-2 text-[10px] text-amber-200 italic">Contoh: &ldquo;Meningkatkan kedisiplinan sholat tepat waktu 5x sehari selama 90 hari.&rdquo;</p>
                        </div>
                      )}
                    </div>
                    <Textarea
                      disabled={locked}
                      value={currentTargetData.mainTarget}
                      onChange={e => updateField("mainTarget", e.target.value)}
                      placeholder={currentPh.sasaran}
                      className="min-h-[90px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl bg-white placeholder:text-slate-400 placeholder:italic"
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-1.5">Mengapa sasaran ini penting?</p>
                    <Textarea
                      disabled={locked}
                      value={currentTargetData.targetAlasan}
                      onChange={e => updateField("targetAlasan", e.target.value)}
                      placeholder="Apa motivasi terdalam Anda mencapai sasaran ini?"
                      className="min-h-[70px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl bg-white placeholder:text-slate-400 placeholder:italic"
                      maxLength={300}
                    />
                  </div>

                  {/* 4 Dimension Structured Indicators (Quality, Quantity, Time, Cost) */}
                  <div className="space-y-3 pt-2">
                    <div className="border-t border-[#EAE5D9] pt-3">
                      <p className="text-sm font-bold text-[#071A33]">Indikator Keberhasilan (4 Dimensi):</p>
                      <p className="text-xs text-slate-500">Peserta tidak harus mengisi semua 4 dimensi (opsional).</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1. Kualitas */}
                      <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-purple-800">1. Indikator Kualitas</span>
                          <div className="group relative cursor-pointer">
                            <Info className="h-4 w-4 text-purple-400 hover:text-purple-600 transition-colors" />
                            <div className="absolute right-0 bottom-6 hidden group-hover:block z-50 bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-52 border border-purple-400/30">
                              <p className="font-bold text-purple-300 mb-0.5">Rumus Skor Kualitas:</p>
                              <p className="opacity-90 leading-tight">Diukur dengan Rating 1–5 Bintang pada Monitoring. <span className="font-mono text-purple-200 block mt-1">Skor % = Bintang × 20%</span></p>
                            </div>
                          </div>
                        </div>
                        <Input
                          disabled={locked}
                          value={currentTargetData.kualitas}
                          onChange={e => updateField("kualitas", e.target.value)}
                          placeholder={currentPh.kualitas}
                          className="text-xs border-slate-200 focus:border-purple-400 rounded-lg h-9 placeholder:text-slate-400 placeholder:italic"
                        />
                      </div>

                      {/* 2. Kuantitas */}
                      <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-800">2. Indikator Kuantitas</span>
                          <div className="group relative cursor-pointer">
                            <Info className="h-4 w-4 text-blue-400 hover:text-blue-600 transition-colors" />
                            <div className="absolute right-0 bottom-6 hidden group-hover:block z-50 bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-56 border border-blue-400/30">
                              <p className="font-bold text-blue-300 mb-0.5">Rumus Skor Kuantitas:</p>
                              <p className="opacity-90 leading-tight">Perbandingan progres dari posisi awal (Baseline) ke Target 90 hari. <span className="font-mono text-blue-200 block mt-1">Skor % = \|Realisasi - Baseline\| ÷ \|Target - Baseline\| × 100%</span></p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Baseline (Awal)</label>
                            <Input
                              disabled={locked}
                              value={currentTargetData.kuantitasBaseline || ""}
                              onChange={e => updateField("kuantitasBaseline", e.target.value)}
                              placeholder={currentPh.kuantitasBaseline}
                              className="text-xs border-slate-200 focus:border-blue-400 rounded-lg h-9 bg-slate-50/50 placeholder:text-slate-400 placeholder:italic"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-blue-600 block mb-0.5">Target Akhir (90 Hari)</label>
                            <Input
                              disabled={locked}
                              value={currentTargetData.kuantitas}
                              onChange={e => updateField("kuantitas", e.target.value)}
                              placeholder={currentPh.kuantitasTarget}
                              className="text-xs border-slate-200 focus:border-blue-400 rounded-lg h-9 placeholder:text-slate-400 placeholder:italic"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Waktu */}
                      <div className="bg-white p-3.5 rounded-xl border border-amber-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-800">3. Indikator Waktu</span>
                          <div className="group relative cursor-pointer">
                            <Info className="h-4 w-4 text-amber-400 hover:text-amber-600 transition-colors" />
                            <div className="absolute right-0 bottom-6 hidden group-hover:block z-50 bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-52 border border-amber-400/30">
                              <p className="font-bold text-amber-300 mb-0.5">Rumus Skor Waktu:</p>
                              <p className="opacity-90 leading-tight">Persentase jumlah hari konsistensi jadwal tepat waktu dalam 30 hari. <span className="font-mono text-amber-200 block mt-1">Skor % = Hari Tepat Waktu ÷ 30 × 100%</span></p>
                            </div>
                          </div>
                        </div>
                        <Input
                          disabled={locked}
                          value={currentTargetData.waktu}
                          onChange={e => updateField("waktu", e.target.value)}
                          placeholder={currentPh.waktu}
                          className="text-xs border-slate-200 focus:border-amber-400 rounded-lg h-9 placeholder:text-slate-400 placeholder:italic"
                        />
                      </div>

                      {/* 4. Biaya */}
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-800">4. Indikator Biaya & Sedekah</span>
                          <div className="group relative cursor-pointer">
                            <Info className="h-4 w-4 text-emerald-400 hover:text-emerald-600 transition-colors" />
                            <div className="absolute right-0 bottom-6 hidden group-hover:block z-50 bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-52 border border-emerald-400/30">
                              <p className="font-bold text-emerald-300 mb-0.5">Rumus Skor Biaya:</p>
                              <p className="opacity-90 leading-tight">Capaian nominal realisasi dibanding nominal target. <span className="font-mono text-emerald-200 block mt-1">Skor % = Realisasi ÷ Target × 100%</span></p>
                            </div>
                          </div>
                        </div>
                        <Input
                          disabled={locked}
                          value={currentTargetData.biaya}
                          onChange={e => updateField("biaya", e.target.value)}
                          placeholder={currentPh.biaya}
                          className="text-xs border-slate-200 focus:border-emerald-400 rounded-lg h-9 placeholder:text-slate-400 placeholder:italic"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formula & Monitoring Integration Banner */}
                  <div className="bg-gradient-to-r from-navy-900 to-slate-800 text-white rounded-xl p-3.5 text-xs flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-300">Integrasi Langsung ke Monitoring</p>
                        <p className="opacity-80 text-[11px]">Baseline & Target di atas akan otomatis dimuat ke halaman Monitoring untuk pelaporan bulanan.</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 text-[10px] shrink-0">Auto-Synced</Badge>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Kebiasaan harian/pekanan yang akan Anda jalankan per area.</p>
            {!locked && (
              <button onClick={() => setShowAddHabit(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-amber-300 text-amber-600 font-bold text-sm rounded-xl hover:bg-amber-50 transition-colors">
                <Plus className="h-4 w-4" />
                Tambah Action Plan Baru
              </button>
            )}
            {showAddHabit && !locked && (
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Kebiasaan / Action Plan</label>
                  <Input value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addActionPlan()} placeholder="Misal: Tahajud 4 Rakaat, Sedekah Subuh..." className="text-sm border-amber-200 focus:border-amber-400 rounded-lg h-10 bg-white" autoFocus />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Frekuensi</label>
                    <select value={newActionFreq} onChange={e => setNewActionFreq(e.target.value)} className="w-full border border-amber-200 rounded-lg px-3 text-xs font-bold text-slate-700 bg-white focus:border-amber-400 h-10">
                      <option value="Harian">Harian (Per Hari)</option>
                      <option value="Pekanan">Pekanan (Per Minggu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Kuantitas Target</label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={newActionQty}
                        onChange={e => setNewActionQty(Number(e.target.value) || 1)}
                        className="text-xs border-amber-200 focus:border-amber-400 rounded-lg h-10 bg-white font-bold text-center"
                      />
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {newActionFreq === "Harian" ? "x / hari" : "x / minggu"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Kategori Area</label>
                    <select value={newActionArea} onChange={e => setNewActionArea(e.target.value)} className="w-full border border-amber-200 rounded-lg px-2 text-xs font-bold text-slate-700 bg-white focus:border-amber-400 h-10">
                      {selectedAreas.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => { setShowAddHabit(false); setNewActionTitle(""); }} className="rounded-lg h-9 px-3 border-amber-200 text-xs">
                    Batal
                  </Button>
                  <Button onClick={addActionPlan} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-9 px-4 font-bold text-xs">
                    Simpan Action Plan
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {actionPlans.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  Belum ada action plan. Tambahkan action plan pertama Anda!
                </div>
              )}
              {actionPlans.map((ap, idx) => {
                const { bg, iconColor, Icon } = getHabitStyle(ap.title);
                return (
                  <div key={idx} className="flex items-center gap-3 p-3.5 bg-white border border-warm-border rounded-xl shadow-2xs hover:border-amber-200 transition-colors group">
                    <div className={`h-9 w-9 rounded-xl ${bg} ${iconColor} flex items-center justify-center shrink-0`}><Icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-navy-900 truncate">{ap.title}</p>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {ap.area_category || "Spiritual Growth"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ap.quantity || 1}x {ap.frequency?.toLowerCase() === "pekanan" ? "per minggu (Pekanan)" : "per hari (Harian)"}
                      </p>
                    </div>
                    {!locked && (
                      <button onClick={() => removeActionPlan(idx)} className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Sahabat Safar (Akuntabilitas Mutual)</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Pilih teman sesama peserta batch Anda. Ketika Anda menekan tombol <strong>&ldquo;Ingatkan Sahabat Safar&rdquo;</strong> di Dashboard, sistem akan mengirimkan notifikasi pengingat secara langsung ke akun mereka.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Pilih Sahabat Safar dari Rombongan/Batch Anda:</label>
              {batchMates.length > 0 ? (
                <select
                  disabled={locked}
                  value={sahabatSafarUserId || ""}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const mate = batchMates.find(m => m.userId === selectedId);
                    setSahabatSafarUserId(selectedId || null);
                    setSahabatSafar(mate ? mate.fullName : "");
                    scheduleAutosave(6);
                  }}
                  className="w-full border border-warm-border focus:border-amber-400 rounded-xl h-11 px-3 text-sm font-bold text-navy-900 bg-white"
                >
                  <option value="">-- Pilih Sahabat Safar --</option>
                  {batchMates.map(m => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <Input
                    disabled={locked}
                    value={sahabatSafar}
                    onChange={e => {
                      setSahabatSafar(e.target.value);
                      scheduleAutosave(6);
                    }}
                    placeholder="Nama Sahabat Safar Anda..."
                    className="text-sm border-warm-border focus:border-amber-400 rounded-xl h-11"
                  />
                  <p className="text-[11px] text-slate-400 italic">
                    Belum ada peserta lain terdaftar di batch Anda. Anda tetap bisa mengetikkan nama manual.
                  </p>
                </div>
              )}
            </div>

            {sahabatSafar && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                  {sahabatSafar.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">Sahabat Safar Terhubung: {sahabatSafar}</p>
                  <p className="text-[10px] text-emerald-700">Tombol &quot;Ingatkan Sahabat Safar&quot; di Dashboard siap mengirimkan notifikasi.</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // ─── Tips Panel ────────────────────────────────────────────────
  const renderTipsPanel = (sectionNum: number) => {
    const tips = SECTION_TIPS[sectionNum];
    if (!tips) return null;
    return (
      <div className="space-y-4">
        <div className="bg-white border border-warm-border rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Info className="h-3.5 w-3.5" /></div>
            <span className="text-sm font-bold text-navy-900">{tips.title}</span>
          </div>
          <ul className="space-y-3">
            {tips.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">{i + 1}</div>
                <div>
                  <p className="text-xs font-bold text-navy-900">{tip.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {tips.example && (
          <div className="bg-white border border-warm-border rounded-2xl p-4 shadow-2xs">
            <p className="text-xs font-bold text-navy-900 mb-2">Contoh Muhasabah</p>
            <blockquote className="text-xs text-slate-600 italic leading-relaxed border-l-2 border-amber-300 pl-3">{tips.example}</blockquote>
            <button className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">Lihat Contoh Lain <ChevronRight className="h-3 w-3" /></button>
          </div>
        )}
        {sectionNum === 5 && actionPlans.length > 0 && (
          <div className="bg-navy-900 text-white rounded-2xl p-4 shadow-2xs">
            <p className="text-xs font-bold mb-0.5">Preview Dashboard Harian</p>
            <p className="text-xs opacity-50 mb-3">Kebiasaan yang akan muncul</p>
            {actionPlans.slice(0, 4).map((ap, i) => {
              const { bg, iconColor, Icon } = getHabitStyle(ap.title);
              return (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className={`h-6 w-6 rounded-lg ${bg} flex items-center justify-center shrink-0`}><Icon className={`h-3 w-3 ${iconColor}`} /></div>
                  <span className="text-xs opacity-80 truncate flex-1">{ap.title}</span>
                  <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Step Dots ─────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-1.5">
      {SECTIONS.map(s => (
        <button key={s.num} onClick={() => setActiveSection(s.num)}
          className={`rounded-full transition-all flex items-center justify-center font-bold text-xs ${s.num === activeSection ? "h-7 w-7 bg-amber-500 text-white shadow" : isSectionComplete(s.num) ? "h-6 w-6 bg-amber-200 text-amber-700" : "h-5 w-5 bg-slate-200 text-slate-400"}`}>
          {isSectionComplete(s.num) && s.num !== activeSection ? <Check className="h-3 w-3" /> : s.num}
        </button>
      ))}
    </div>
  );

  // ─── Celebration ───────────────────────────────────────────────
  const renderCelebration = () => (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-7xl mb-2">📖</div>
      <div className="text-3xl mb-3">✨✨</div>
      <h2 className="text-2xl font-black text-navy-900 mb-2">Journey Setup Selesai!</h2>
      <p className="text-slate-500 text-sm mb-5 max-w-xs">Kontrak perjalanan Anda telah selesai disimpan.</p>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-2 ${ptpStatus === "LOCKED" ? "bg-navy-100 text-navy-700 border border-navy-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
        {ptpStatus === "LOCKED" ? <Lock className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
        Status Kontrak: {ptpStatus}
      </div>
      {ptpStatus === "EDITABLE" && <p className="text-xs text-slate-400 mb-6 max-w-xs">PTP masih dapat diperbarui hingga Admin mengunci kontrak.</p>}
      <div className="w-full max-w-sm bg-white border border-warm-border rounded-2xl p-4 shadow-2xs mb-6 text-left">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ringkasan Kontrak Anda</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center"><span className="text-sm text-slate-600">6 Bagian</span><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Selesai</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Terakhir diubah</span><span className="text-sm font-semibold text-navy-900">{lastSaved ? `Hari ini, ${lastSaved.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Baru saja"}</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Coach</span><span className="text-sm font-semibold text-navy-900 truncate max-w-[150px]">{coachName}</span></div>
        </div>
      </div>
      <Button onClick={() => router.push("/dashboard")} className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl h-11 px-8 font-bold shadow-lg">Kembali ke Dashboard</Button>
    </div>
  );

  // ─── Desktop Stats Bar ─────────────────────────────────────────
  const renderStatsBar = () => (
    <div className="border-b border-warm-border bg-white px-6 py-2.5 flex items-center justify-between gap-5 text-xs overflow-x-auto shrink-0">
      {/* Left side: Tombol Kembali ke Home */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-navy-900 bg-slate-50 border border-warm-border px-3.5 py-1.5 rounded-full shadow-2xs hover:bg-slate-100 transition-colors shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
        <span>Kembali ke Home</span>
      </button>

      {/* Right side: All Stats Info & Autosave */}
      <div className="flex items-center gap-5 shrink-0 ml-auto">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Progress Journey</span>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-navy-900">Hari ke-{dayCount}</span>
            <span className="text-slate-400">dari 90 hari</span>
          </div>
        </div>
        <div className="w-px h-7 bg-warm-border shrink-0" />
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Status Kontrak PTP</span>
          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] mt-0.5 ${ptpStatus === "LOCKED" ? "bg-navy-100 text-navy-700" : "bg-amber-100 text-amber-700"}`}>
            {ptpStatus === "LOCKED" ? <Lock className="h-2.5 w-2.5" /> : <Edit3 className="h-2.5 w-2.5" />}{ptpStatus}
          </span>
        </div>
        <div className="w-px h-7 bg-warm-border shrink-0" />
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Coach</span>
          <span className="font-semibold text-navy-900 block leading-tight">{coachName}</span>
          <span className="text-slate-400 block text-[10px]">Ditunjuk oleh Admin</span>
        </div>
        <div className="w-px h-7 bg-warm-border shrink-0" />
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Autosave</span>
          <SaveIndicator />
        </div>
      </div>
    </div>
  );

  // ─── Desktop Section Navigator ─────────────────────────────────
  const renderDesktopNav = () => (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="p-5 border-b border-warm-border">
        <h2 className="text-base font-black text-navy-900">Journey Setup</h2>
        <p className="text-xs text-slate-400 mt-0.5">Kontrak Perjalanan 90 Hari</p>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-navy-900">{progressPct}% Complete</span>
            {estimatedMinutes > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />~{estimatedMinutes} mnt</span>}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{completedCount} dari 6 bagian selesai</p>
        </div>
      </div>
      <div className="flex-1 p-3">
        {SECTIONS.map(sec => {
          const status = getSectionStatus(sec.num);
          const isActive = activeSection === sec.num;
          return (
            <button key={sec.num} onClick={() => setActiveSection(sec.num)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl text-left mb-1.5 transition-all ${isActive ? "bg-amber-50 border-2 border-amber-300 shadow-sm" : "hover:bg-slate-50 border-2 border-transparent"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors ${status === "completed" || isActive ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {status === "completed" ? <Check className="h-4 w-4" /> : sec.num}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight ${isActive ? "text-amber-700" : "text-navy-900"}`}>{sec.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{sec.subtitle}</p>
                {status !== "completed" && (
                  <div className="mt-1.5">
                    {isActive ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">● In Progress</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">Not Started</span>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 mt-2 ${isActive ? "text-amber-500" : "text-slate-300"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <ParticipantLayout activePath="/journey" hideBackToHome noPadding hideFooter>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Memuat Journey...</p>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <ParticipantLayout activePath="/journey" pageTitle="Journey (PTP)" hideBackToHome noPadding hideFooter>

      {/* ── MOBILE (< lg) ─────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-[calc(100dvh-64px-56px)] overflow-hidden">

        {/* MOBILE: Celebration */}
        {showCelebration && (
          <div className="flex flex-col h-full overflow-y-auto bg-white">
            {renderCelebration()}
          </div>
        )}

        {/* MOBILE: Navigator */}
        {!showCelebration && mobileView === "navigator" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* FIXED TOP HEADER (Kembali ke Home s/d Hari ke-X & Progress — TIDAK BISA DI-SCROLL) */}
            <div className="shrink-0 bg-white border-b border-warm-border">
              {/* Page header with Back to Home button */}
              <div className="px-4 pt-3 pb-2.5">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-navy-900 mb-1.5 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
                  <span>Kembali ke Home</span>
                </button>
                <h1 className="text-xl font-black text-navy-900 leading-tight">Journey Setup</h1>
                <p className="text-xs text-slate-400 mt-0.5">Kontrak Perjalanan 90 Hari</p>
              </div>

              {/* Info bar */}
              <div className="bg-slate-50 border-t border-b border-warm-border px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold">HARI KE-{dayCount}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">{dayCount} DARI 90</span>
                </div>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${ptpStatus === "LOCKED" ? "bg-navy-100 text-navy-700" : "bg-amber-100 text-amber-700"}`}>
                  {ptpStatus} {ptpStatus === "LOCKED" ? "🔒" : "✏️"}
                </span>
              </div>

              {/* Progress */}
              <div className="px-4 pt-3 pb-3 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-navy-900">{progressPct}% Complete</span>
                  {estimatedMinutes > 0 && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />~{estimatedMinutes} mnt
                    </span>
                  )}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{completedCount} dari 6 bagian selesai</p>
              </div>
            </div>

            {/* SCROLLABLE SECTION LIST (BISA DI-SCROLL) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 relative bg-white">
              <div className="absolute left-[35px] sm:left-[36px] top-6 bottom-8 w-0.5 bg-slate-200 z-0" />
              {SECTIONS.map(sec => {
                const status = getSectionStatus(sec.num);
                return (
                  <button
                    key={sec.num}
                    onClick={() => { setActiveSection(sec.num); setMobileView("editor"); }}
                    className="relative z-10 w-full flex items-start gap-3.5 py-3 text-left group"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 transition-all ${status === "completed" ? "bg-amber-500 border-amber-500 text-white shadow-sm" : status === "in-progress" ? "bg-amber-500 border-amber-500 text-white shadow-sm ring-4 ring-amber-100" : "bg-white border-slate-200 text-slate-400 group-hover:border-amber-300"}`}>
                      {status === "completed" ? <Check className="h-4 w-4" /> : sec.num}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-navy-900 group-hover:text-amber-700 transition-colors">{sec.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{sec.subtitle}</p>
                      {status !== "completed" && (
                        <div className="mt-1.5">
                          {status === "in-progress" && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">● In Progress</span>}
                          {status === "not-started" && <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">Not Started</span>}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-3 group-hover:text-amber-500 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MOBILE: Editor */}
        {!showCelebration && mobileView === "editor" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* FIXED TOP BAR & STEP DOTS (TIDAK BISA DI-SCROLL) */}
            <div className="shrink-0 bg-white border-b border-warm-border">
              {/* Mobile editor top bar */}
              <div className="px-4 py-3 flex items-center justify-between">
                <button onClick={() => setMobileView("navigator")} className="flex items-center gap-1.5 text-sm text-slate-700 font-bold hover:text-navy-900">
                  <ArrowLeft className="h-4 w-4 text-amber-600" />
                  <span>Journey Setup</span>
                </button>
                <button onClick={() => setMobileView("tips")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60">
                  <Info className="h-3.5 w-3.5" />
                  <span>Tips</span>
                </button>
              </div>

              {/* Step dots */}
              <div className="bg-slate-50 border-t border-warm-border px-4 py-2.5 flex items-center justify-between">
                <StepDots />
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">STEP {activeSection} OF 6</span>
              </div>
            </div>

            {/* SCROLLABLE CONTENT AREA (HANYA AREA INI YANG DI-SCROLL) */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              <div className="mb-4">
                <h2 className="text-xl font-black text-navy-900">{SECTIONS[activeSection - 1].title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{SECTIONS[activeSection - 1].subtitle}</p>
              </div>
              {renderSectionContent(activeSection)}
              <div className="mt-5 flex justify-center py-2"><SaveIndicator /></div>
            </div>

            {/* FIXED BOTTOM NAV (TIDAK BISA DI-SCROLL, MENEMPEL TEPAT DI ATAS BOTTOM DOCK NAV) */}
            <div className="shrink-0 border-t border-warm-border bg-white p-3 flex items-center gap-3 shadow-md">
              <Button variant="outline" onClick={goToPrev} className="flex-1 flex items-center justify-center gap-2 border-warm-border text-slate-700 rounded-xl h-11 font-bold">
                <ArrowLeft className="h-4 w-4" />Sebelumnya
              </Button>
              <Button onClick={goToNext} className="flex-1 flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl h-11 font-bold shadow-sm">
                {activeSection === 6 ? "Selesai ✓" : "Selanjutnya"}<ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* MOBILE: Tips overlay */}
        {!showCelebration && mobileView === "tips" && (
          <div className="flex flex-col h-full overflow-hidden bg-slate-50">
            <div className="shrink-0 bg-white border-b border-warm-border px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-navy-900">{SECTION_TIPS[activeSection]?.title}</span>
              <button onClick={() => setMobileView("editor")} className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{renderTipsPanel(activeSection)}</div>
          </div>
        )}
      </div>

      {/* ── DESKTOP (>= lg) ────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col h-[calc(100vh-64px)] bg-white">
        {renderStatsBar()}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Section Navigator */}
          <div className="w-72 xl:w-80 border-r border-warm-border shrink-0 overflow-y-auto bg-white">
            {renderDesktopNav()}
          </div>
          {/* Middle panel: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {showCelebration ? (
              <div className="flex-1 overflow-y-auto">{renderCelebration()}</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 xl:p-8">
                  {/* Section header */}
                  <div className="mb-6 space-y-3">
                    <StepDots />
                    <div>
                      <h2 className="text-2xl font-black text-navy-900">{SECTIONS[activeSection - 1].title}</h2>
                      <p className="text-sm text-slate-500 mt-0.5">{SECTIONS[activeSection - 1].subtitle}</p>
                    </div>
                  </div>
                  {renderSectionContent(activeSection)}
                </div>
                {/* Bottom nav */}
                <div className="border-t border-warm-border bg-white px-6 py-4 flex items-center justify-end shrink-0">
                  <div className="flex items-center gap-3">
                    <SaveIndicator />
                    <Button variant="outline" onClick={goToPrev} disabled={activeSection === 1} className="flex items-center gap-2 border-warm-border text-slate-600 rounded-xl h-10 px-4">
                      <ArrowLeft className="h-4 w-4" /><span className="text-sm font-semibold">Sebelumnya</span>
                    </Button>
                    <Button onClick={goToNext} className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl h-10 px-5 font-bold shadow-sm">
                      <span className="text-sm">{activeSection === 6 ? "Selesai ✓" : "Selanjutnya"}</span><ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Right panel: Tips */}
          {!showCelebration && (
            <div className="w-64 xl:w-72 border-l border-warm-border shrink-0 overflow-y-auto bg-slate-50/50 p-4">
              {renderTipsPanel(activeSection)}
            </div>
          )}
        </div>
      </div>
    </ParticipantLayout>
  );
}
