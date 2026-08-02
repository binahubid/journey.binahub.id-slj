"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { TRANSFORMATION_AREAS } from "@/lib/transformation-areas";
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
  MessageSquare,
  Trash2,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Lightbulb,
} from "lucide-react";

// ─── Section Config ─────────────────────────────────────────────
const SECTIONS = [
  { num: 1, title: "Hasil Muhasabah", subtitle: "Insight terbesar tentang diri Anda" },
  { num: 2, title: "Niat Perubahan", subtitle: "Landasan komitmen ibadah karena Allah ﷻ" },
  { num: 3, title: "Area Transformasi", subtitle: "Pilih area fokus dan tetapkan target 90 hari" },
  { num: 4, title: "Action Plan (Habit Engine)", subtitle: "Kebiasaan harian/mingguan yang dipantau" },
];

// ─── Area List ───────────────────────────────────────────────────
const AREA_LIST = [
  { id: "Spiritual Growth", icon: Compass, label: "Spiritual Growth", desc: "hubungan kita dengan Allah ﷻ", color: TRANSFORMATION_AREAS["Spiritual Growth"].color },
  { id: "Personal Development", icon: Zap, label: "Personal Development", desc: "hubungan kita dengan diri sendiri", color: TRANSFORMATION_AREAS["Personal Development"].color },
  { id: "Leadership Excellence", icon: Award, label: "Leadership Excellence", desc: "amanah, tugas dan tanggung jawab kita dalam pekerjaan", color: TRANSFORMATION_AREAS["Leadership Excellence"].color },
  { id: "Relationship", icon: Users, label: "Relationship", desc: "hubungan kita dengan orang lain", color: TRANSFORMATION_AREAS.Relationship.color },
  { id: "Community Impact", icon: Globe, label: "Community Impact", desc: "dampak terhadap lingkungan sekitar", color: TRANSFORMATION_AREAS["Community Impact"].color },
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
    example: "\"Saya sering menunda ibadah penting karena merasa tidak punya waktu. Saya ingin menjadi pribadi yang lebih disiplin dan konsisten dalam beribadah kepada Allah ﷻ.\"",
  },
  2: {
    title: "Tips Menulis Niat",
    tips: [
      { icon: "✦", title: "Awali dengan Bismillah", desc: "Mulai niat dengan nama Allah ﷻ agar terjaga keikhlasannya." },
      { icon: "✦", title: "Tuliskan motivasi terdalam", desc: "Mengapa perubahan ini penting bagi Anda dan orang sekitar." },
      { icon: "✦", title: "Niat yang spesifik bertahan lebih lama", desc: "Niat yang jelas lebih mudah diingat di saat-saat sulit." },
    ],
  },
  3: {
    title: "Tips Area & Sasaran",
    tips: [
      { icon: "✦", title: "Fokus adalah kunci", desc: "3 area maksimal agar energi tidak tersebar terlalu luas." },
      { icon: "✦", title: "Target SMART", desc: "Specific · Measurable · Achievable · Relevant · Time-bound." },
      { icon: "✦", title: "Indikator 4 Dimensi", desc: "Lengkapi Kualitas, Kuantitas, Waktu, dan Biaya untuk hasil terukur." },
    ],
  },
  4: {
    title: "Tips Habit Engine",
    tips: [
      { icon: "✦", title: "Mulai dari yang kecil", desc: "Kebiasaan kecil yang konsisten lebih efektif dari yang besar tapi tidak dilakukan." },
      { icon: "✦", title: "Harian lebih baik dari mingguan", desc: "Frekuensi tinggi membangun otot kebiasaan lebih cepat." },
      { icon: "✦", title: "Kaitkan dengan area transformasi", desc: "Pilih kebiasaan yang langsung mendukung area yang dipilih." },
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // UI
  const [activeSection, setActiveSection] = useState(1);
  const [mobileView, setMobileView] = useState<"navigator" | "editor" | "tips">("navigator");
  const [showCelebration, setShowCelebration] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hadithOpen, setHadithOpen] = useState(false);
  const [openAreaEditor, setOpenAreaEditor] = useState<string>("");
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);
  const [recsOpen, setRecsOpen] = useState(false);

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
  const selectedAreasRef = useRef<string[]>([]);
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
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // Section 4 (Tab Per Area)
  const [activeAreaTab, setActiveAreaTab] = useState<string>("");
  const [areaTargetsMap, setAreaTargetsMap] = useState<Record<string, AreaTargetData>>({});

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
        setLoadError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (profileError) throw profileError;
        const { data: journey, error: journeyError } = await supabase.from("journeys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (journeyError) throw journeyError;

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

          const journeyAreas = Array.isArray(journey.area_transformasi)
            ? journey.area_transformasi.map((area: string) => String(area))
            : [];
          if (journeyAreas.length > 0) {
            setSelectedAreas(journeyAreas);
            setActiveAreaTab(journeyAreas[0]);
            setNewActionArea(journeyAreas[0]);
          }

          // Target & Indicators per area parsing
          try {
            const parsedTargets = JSON.parse(journey.main_target || "{}");
            if (parsedTargets && typeof parsedTargets === "object" && !parsedTargets.target) {
              setAreaTargetsMap(parsedTargets);
            } else if (parsedTargets.target) {
              // Legacy format fallback
              setAreaTargetsMap({
                  [journeyAreas[0] || "Spiritual Growth"]: {
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
                [journeyAreas[0] || "Spiritual Growth"]: {
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
          const { data: plans, error: plansError } = await supabase.from("action_plans").select("id, title, frequency, quantity, target, category, area_category").eq("journey_id", journey.id);
          if (plansError) throw plansError;
          if (plans && plans.length > 0) {
            setActionPlans(plans.map(p => ({
              id: p.id,
              title: p.title,
              frequency: p.frequency || "Harian",
              quantity: p.quantity || p.target || 1,
              area_category: p.area_category || p.category || journey.area_transformasi?.[0] || "Spiritual Growth",
            })));
          } else {
            const { data: uh, error: habitsError } = await supabase.from("habits").select("*").eq("user_id", user.id).eq("is_archived", false);
            if (habitsError) throw habitsError;
            if (uh && uh.length > 0) {
              setActionPlans(uh.map(h => ({
                // Legacy habits have no Action Plan identity; let autosave create the canonical relation.
                id: undefined,
                title: h.title,
                frequency: h.frequency || "Harian",
                quantity: h.quantity || h.target || 1,
                area_category: h.area_category || h.category || journey.area_transformasi?.[0] || "Spiritual Growth",
              })));
            }
          }

          // Support Team
          try {
            const { data: team, error: teamError } = await supabase.from("support_team").select("coach_name, sahabat_safar_name, sahabat_safar_user_id").eq("journey_id", journey.id).maybeSingle();
            if (teamError) throw teamError;
            if (team?.coach_name) setCoachName(team.coach_name);
            if (team?.sahabat_safar_name) setSahabatSafar(team.sahabat_safar_name);
            if (team?.sahabat_safar_user_id) setSahabatSafarUserId(team.sahabat_safar_user_id);
          } catch (teamError) {
            console.error("Support team load error:", teamError);
            setSaveError("Data tim pendukung belum dapat dimuat.");
          }
        }
      } catch (err) {
        console.error("Journey load error:", err);
        setLoadError("Data PTP gagal dimuat. Periksa koneksi lalu coba muat ulang halaman.");
      }
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

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

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
      switch (sectionNum) {
        case 1: {
          const { error } = await supabase.from("journeys").update({ muhasabah: muhasabahRef.current, updated_at: new Date().toISOString() }).eq("id", _journeyId);
          if (error) throw error;
          break;
        }
        case 2: {
          const { error } = await supabase.from("journeys").update({ niat: JSON.stringify({ niat: niatRef.current, alasan: niatAlasanRef.current }), updated_at: new Date().toISOString() }).eq("id", _journeyId);
          if (error) throw error;
          break;
        }
        case 3: {
          // Save area selection + target indicators together (merged step)
          const targetsObj = areaTargetsMapRef.current;
          const jsonStr = JSON.stringify(targetsObj);
          const allIndicators = Object.values(targetsObj).flatMap(t => [t.kualitas, t.kuantitas, t.waktu, t.biaya].filter(b => b && b.trim() !== ""));
          const { error } = await supabase.from("journeys").update({
            area_transformasi: selectedAreasRef.current,
            main_target: jsonStr,
            success_indicators: allIndicators,
            updated_at: new Date().toISOString()
          }).eq("id", _journeyId);
          if (error) throw error;
          break;
        }
        case 4: {
          const _plans = actionPlansRef.current;
          // Fetch existing action_plans for this journey
          const { data: existingPlans, error: existingPlansError } = await supabase.from("action_plans").select("id, title").eq("journey_id", _journeyId);
          if (existingPlansError) throw existingPlansError;
          const currentPlanIds = new Set(_plans.map((p) => p.id).filter(Boolean));
          const currentTitles = new Set(_plans.map((p) => p.title.trim().toLowerCase()));

          // Delete only plans that were removed by user. IDs are preferred so duplicate titles cannot collide.
          const toDelete = (existingPlans || []).filter((p) => !currentPlanIds.has(p.id) && !currentTitles.has(p.title.trim().toLowerCase()));
          if (toDelete.length > 0) {
            const { error } = await supabase.from("action_plans").delete().in("id", toDelete.map((p) => p.id));
            if (error) throw error;
          }

          // Insert or update remaining plans
          for (const ap of _plans) {
            const match = (existingPlans || []).find((p) => p.id === ap.id) ||
              (existingPlans || []).find((p) => p.title === ap.title);
            let apId = match?.id;

            if (match) {
              const { error } = await supabase.from("action_plans").update({
                category: ap.area_category || "Spiritual Growth",
                area_category: ap.area_category || "Spiritual Growth",
                frequency: ap.frequency,
                quantity: ap.quantity || 1,
                target: ap.quantity || 1,
              }).eq("id", match.id);
              if (error) throw error;
            } else {
              const { data: inserted, error } = await supabase.from("action_plans").insert({
                journey_id: _journeyId,
                user_id: user.id,
                title: ap.title,
                category: ap.area_category || "Spiritual Growth",
                area_category: ap.area_category || "Spiritual Growth",
                frequency: ap.frequency,
                quantity: ap.quantity || 1,
                target: ap.quantity || 1,
              }).select().maybeSingle();
              if (error) throw error;
              apId = inserted?.id;
            }

            if (!apId) throw new Error(`Action plan ${ap.title} tidak memiliki ID.`);
            const { error: habitError } = await supabase.from("habits").upsert({
              user_id: user.id,
              action_plan_id: apId,
              title: ap.title,
              category: ap.area_category || "Spiritual Growth",
              area_category: ap.area_category || "Spiritual Growth",
              frequency: ap.frequency,
              quantity: ap.quantity || 1,
              target: ap.quantity || 1,
            }, { onConflict: "action_plan_id" });
            if (habitError) throw habitError;
          }
          break;
        }
      }
      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("idle");
      setSaveError("Perubahan PTP belum tersimpan. Periksa koneksi lalu coba lagi.");
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────
  const isSectionComplete = (num: number) => {
    switch (num) {
      case 1: return muhasabah.trim().length > 0;
      case 2: return niat.trim().length > 0;
      case 3: return selectedAreas.length === 3 && selectedAreas.every(area => areaTargetsMap[area]?.mainTarget?.trim().length > 0);
      case 4: return actionPlans.length > 0 && actionPlans.every(plan => selectedAreas.includes(plan.area_category));
      default: return false;
    }
  };

  const completedCount = SECTIONS.filter((_, i) => isSectionComplete(i + 1)).length;
  const progressPct = Math.round((completedCount / SECTIONS.length) * 100);
  const estimatedMinutes = Math.max(0, (SECTIONS.length - completedCount) * 6);

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
    if (selectedAreas.includes(id)) {
      if (actionPlans.some(plan => plan.area_category === id)) {
        setSaveError(`Pindahkan atau hapus Action Plan pada area ${id} sebelum membatalkan area ini.`);
        return;
      }
      next = selectedAreas.filter(a => a !== id);
    }
    else { if (selectedAreas.length >= 3) return; next = [...selectedAreas, id]; }
    setSaveError(null);
    setSelectedAreas(next);
    selectedAreasRef.current = next;
    scheduleAutosave(3);
  };

  const addActionPlan = () => {
    if (ptpStatus === "LOCKED" || !newActionTitle.trim()) return;
    const title = newActionTitle.trim();
    if (actionPlans.some(plan => plan.title.trim().toLowerCase() === title.toLowerCase())) {
      setSaveError("Action Plan dengan nama yang sama sudah ada.");
      return;
    }
    const next = [...actionPlans, { id: undefined, title, frequency: newActionFreq, quantity: Math.max(1, Number(newActionQty) || 1), area_category: newActionArea }];
    setActionPlans(next);
    setNewActionTitle("");
    setShowAddHabit(false);
    scheduleAutosave(4);
  };

  const removeActionPlan = (idx: number) => {
    if (ptpStatus === "LOCKED") return;
    const next = actionPlans.filter((_, i) => i !== idx);
    setActionPlans(next);
    scheduleAutosave(4);
  };

  const updateActionPlanArea = async (idx: number, area: string) => {
    if (ptpStatus === "LOCKED" || !selectedAreas.includes(area)) return;
    const plan = actionPlans[idx];
    const next = actionPlans.map((plan, planIndex) =>
      planIndex === idx ? { ...plan, area_category: area } : plan
    );
    setActionPlans(next);
    actionPlansRef.current = next;

    if (!plan?.id) {
      scheduleAutosave(4);
      return;
    }

    setSaveStatus("saving");
    try {
      const { error: planError } = await supabase.from("action_plans").update({
        category: area,
        area_category: area,
      }).eq("id", plan.id);
      if (planError) throw planError;

      const { error: habitError } = await supabase.from("habits").update({
        category: area,
        area_category: area,
      }).eq("action_plan_id", plan.id);
      if (habitError) throw habitError;

      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (error) {
      console.error("Gagal memperbarui area Action Plan:", error);
      setActionPlans(actionPlans);
      actionPlansRef.current = actionPlans;
      setSaveError("Area Action Plan belum diperbarui. Coba lagi.");
      setSaveStatus("idle");
    }
  };

  const goToNext = () => {
    if (!isSectionComplete(activeSection)) {
      setSaveError(`Lengkapi bagian "${SECTIONS[activeSection - 1].title}" sebelum melanjutkan.`);
      return;
    }
    if (activeSection < SECTIONS.length) { setSaveError(null); setActiveSection(activeSection + 1); setMobileView("editor"); }
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
        <><div className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse" /><span className="text-slate-600 font-medium">Menyimpan...</span></>
      ) : saveStatus === "saved" ? (
        <><div className="h-1.5 w-1.5 bg-green-500 rounded-full" /><span className="text-slate-600 font-medium">Tersimpan otomatis {getLastSavedText()}</span></>
      ) : (
        <><div className="h-1.5 w-1.5 bg-slate-400 rounded-full" /><span className="text-slate-600 font-medium">Siap disimpan</span></>
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
            {/* Collapsible Reflection Guide (Solid Background) */}
            <div className="bg-[#071A33] border-l-4 border-amber-400 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setGuideOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm font-black">✦</span>
                  <span className="text-sm font-extrabold text-white">Reflection Guide</span>
                </div>
                <ChevronRight className={`h-4 w-4 text-amber-400 transition-transform duration-200 ${guideOpen ? "rotate-90" : ""}`} />
              </button>
              {guideOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-700/60 bg-[#071A33]">
                  <ul className="text-xs sm:text-sm text-slate-200 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">1.</span> Apa bagian dari hati dan kehidupan saya yang paling membutuhkan pertolongan Allah?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">2.</span> Apa yang paling ingin saya perbaiki melalui program ini?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">3.</span> Kenapa area perbaikan itu penting?</li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Tuliskan Muhasabah diri Anda secara jujur dan mendalam.</p>
              <Textarea disabled={locked} value={muhasabah} onChange={e => { setMuhasabah(e.target.value); scheduleAutosave(1); }} placeholder="Tulis di sini..." className="min-h-[180px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl" maxLength={2000} />
              <div className="text-right text-xs text-slate-400 mt-1">{muhasabah.length} / 2000</div>
            </div>
            <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Catatan untuk Coach (opsional)</span>
              </div>
              <Textarea disabled={locked} placeholder="Tulis catatan untuk Coach..." className="min-h-[72px] text-sm resize-none border-slate-200 rounded-lg bg-white text-xs" maxLength={500} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Collapsible Reflection Guide */}
            <div className="bg-[#071A33] border-l-4 border-amber-400 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setHadithOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm font-black">✦</span>
                  <span className="text-sm font-extrabold text-white">Reflection Guide</span>
                </div>
                <ChevronRight className={`h-4 w-4 text-amber-400 transition-transform duration-200 ${hadithOpen ? "rotate-90" : ""}`} />
              </button>
              {hadithOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-700/60 bg-[#071A33]">
                  <ul className="text-xs sm:text-sm text-slate-200 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">1.</span> Mengapa saya ingin berangkat Umrah, dan apakah niat saya benar-benar karena Allah? Bagaimana saya meluruskan niat ini?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">2.</span> Pribadi seperti apa yang ingin saya bentuk setelah kembali dari Tanah Suci?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">3.</span> Apa komitmen yang saya ikrarkan kepada Allah untuk mewujudkan perubahan itu?</li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Tulis niat perubahan Anda dengan jelas.</p>
              <Textarea disabled={locked} value={niat} onChange={e => { setNiat(e.target.value); scheduleAutosave(2); }} placeholder="Tulis niat Anda di sini..." className="min-h-[140px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl" maxLength={1000} />
              <div className="text-right text-xs text-slate-400 mt-1">{niat.length} / 1000</div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Mengapa niat ini penting bagi Anda?</p>
              <Textarea disabled={locked} value={niatAlasan} onChange={e => { setNiatAlasan(e.target.value); scheduleAutosave(2); }} placeholder="Tulis alasan Anda..." className="min-h-[80px] text-sm resize-none border-warm-border focus:border-amber-400 rounded-xl" maxLength={500} />
              <div className="text-right text-xs text-slate-400 mt-1">{niatAlasan.length} / 500</div>
            </div>
          </div>
        );

      case 3: {
        // Merged: Area selection + inline target editor per area
        const updateField = (areaId: string, field: keyof AreaTargetData, value: string) => {
          const prev = areaTargetsMap[areaId] || { mainTarget: "", targetAlasan: "", kualitas: "", kuantitas: "", kuantitasBaseline: "", waktu: "", biaya: "" };
          const updated = { ...areaTargetsMap, [areaId]: { ...prev, [field]: value } };
          setAreaTargetsMap(updated);
          scheduleAutosave(3);
        };

        const shortcutsByArea: Record<string, { kualitas: string[]; kuantitas: string[]; waktu: string[]; biaya: string[] }> = {
          "Spiritual Growth": {
            kualitas: ["Khusyu, tumakninah & dzikir sesudah salam", "Meresapi makna ayat Al-Qur'an yang dibaca", "Menjaga wudhu dan niat ikhlas karena Allah", "Menghindari perkataan sia-sia dan ghibah", "Hadir Hati saat berdoa & istighfar harian"],
            kuantitas: ["Khatam 1 Juz / minggu (90 hari 13 Juz)", "Sholat 5 waktu berjamaah di masjid", "Sholat Tahajud 4 rakaat + Witir 3x/minggu", "Sholat Dhuha 4 rakaat setiap pagi", "Membaca Al-Matsurat pagi & petang 7x/minggu"],
            waktu: ["Hadir di masjid 10 menit sebelum adzan", "Tahajud jam 04:00 - 04:30 sebelum Subuh", "Tilawah Al-Qur'an 20 menit setelah Subuh", "Dzikir pagi jam 06:30 - 06:45", "Evaluasi muhasabah malam jam 21:30"],
            biaya: ["Budget Rp 10.000 / hari via transfer", "Budget Rp 20.000 / hari via transfer", "Budget Rp 50.000 / hari via transfer", "Infak rutin Rp 100.000 / minggu ke panti/masjid", "Wakaf Quran Rp 150.000 / bulan"]
          },
          "Personal Development": {
            kualitas: ["Merespon masalah secara tenang tanpa emosi meluap", "Mampu berpikir jernih saat di bawah tekanan", "Disiplin menjalankan rencana harian tanpa menunda", "Jujur mengakui kesalahan dan langsung memperbaiki", "Fokus mengerjakan 1 tugas hingga tuntas (deep work)"],
            kuantitas: ["Maksimal 2 jam screen time non-produktif/hari", "Membaca 1 buku pengembangan diri / bulan", "Menulis jurnal refleksi 1x setiap malam", "Menyelesaikan 1 modul kursus/skill baru per minggu", "Evaluasi habit harian 7x / minggu"],
            waktu: ["Alokasi membaca jam 20:00 - 20:30 setiap malam", "Deep work jam 08:30 - 10:30 tanpa distraksi", "Bangun pagi jam 04:30 secara konsisten", "Review mingguan setiap hari Minggu jam 16:00", "Digital detox jam 21:00 - 05:00"],
            biaya: ["Budget pembelian buku Rp 150.000 / bulan", "Budget pelatihan / webinar Rp 300.000 / bulan", "Budget langganan platform edukasi Rp 100.000 / bulan", "Budget alat pendukung belajar Rp 200.000 / bulan", "Budget tabungan pengembangan diri Rp 500.000 / bulan"]
          },
          "Leadership Excellence": {
            kualitas: ["Memberikan arahan tugas yang jelas & konstruktif", "Menjadi teladan etos kerja & kedisiplinan tim", "Aktif mendengarkan dan menghargai masukan tim", "Mengambil keputusan berbasis data & nilai etika", "Memberikan feedback positif & membangun secara berkala"],
            kuantitas: ["100% KPI proyek selesai sebelum deadline", "1-on-1 coaching dengan anggota tim 2x / minggu", "Melakukan pembinaan / mentoring tim 1x / minggu", "Menyelesaikan 3 milestone strategis dalam 90 hari", "Nol keluhan keterlambatan laporan dari manajemen"],
            waktu: ["Hadir 15 menit sebelum rapat/meeting dimulai", "Session 1-on-1 coaching setiap Senin jam 10:00", "Daily standup meeting jam 09:00 - 09:15", "Review kinerja tim setiap hari Jumat jam 15:00", "Penyelesaian laporan mingguan setiap Kamis jam 16:00"],
            biaya: ["Budget apresiasi tim Rp 300.000 / bulan", "Budget makan siang / coaching tim Rp 500.000 / bulan", "Budget sertifikasi profesional Rp 1.000.000 / batch", "Budget fasilitasi alat kerja tim Rp 250.000 / bulan", "Budget kegiatan keakraban tim Rp 400.000 / bulan"]
          },
          "Relationship": {
            kualitas: ["Mendengarkan cerita keluarga tanpa terdistraksi HP", "Berbicara dengan nada lembut, sabar & empati tinggi", "Mudah memaafkan & meminta maaf saat ada khilaf", "Menunjukkan apresiasi & rasa terima kasih setiap hari", "Menciptakan suasana hangat & aman di rumah/lingkungan"],
            kuantitas: ["Makan malam bersama keluarga tanpa gadget 5x/minggu", "Quality time khusus pasangan/keluarga 1x / minggu", "Menghubungi orang tua / saudara via telp 3x / minggu", "Silaturahim dengan sahabat / teman 2x / bulan", "Family gathering weekend 4x / bulan"],
            waktu: ["No-gadget hour jam 18:30 - 20:00 bersama keluarga", "Family time Sabtu pagi jam 08:00 - 11:00", "Telepon orang tua setiap Minggu jam 19:30", "Ngobrol santai sebelum tidur jam 21:00 - 21:30", "Jalan bersama pasangan setiap Jumat malam jam 19:00"],
            biaya: ["Budget rekreasi & makan keluarga Rp 500.000 / bulan", "Budget rekreasi & makan keluarga Rp 1.000.000 / bulan", "Budget nafkah / bakti orang tua Rp 500.000 / bulan", "Budget hadiah / kejutan keluarga Rp 300.000 / bulan", "Budget tabungan liburan keluarga Rp 750.000 / bulan"]
          },
          "Community Impact": {
            kualitas: ["Memberikan pendampingan warga secara tulus & ikhlas", "Aktif mencari solusi masalah lingkungan sekitar", "Ramah & peduli terhadap tetangga serta masyarakat", "Berbagi ilmu & pengalaman dengan niat memberi manfaat", "Menjadi penggerak kebaikan di lingkungan tempat tinggal"],
            kuantitas: ["Mengajar / bakti sosial 4 jam setiap akhir pekan", "Mengikuti kegiatan gotong royong / RT 2x / bulan", "Berbagi makanan / sembako ke tetangga 2x / bulan", "Menjadi relawan program pemberdayaan 1x / bulan", "Mengisi materi / edukasi komunitas 1x / bulan"],
            waktu: ["Bakti sosial setiap hari Sabtu jam 09:00 - 11:00", "Kerja bakti lingkungan Minggu pagi jam 07:00 - 09:00", "Pengajian / majelis warga Minggu malam jam 19:30", "Rapat RT / komunitas setiap awal bulan jam 20:00", "Aktivitas relawan Sabtu sore jam 15:30 - 17:30"],
            biaya: ["Donasi rutin kegiatan warga Rp 100.000 / bulan", "Donasi rutin program masyarakat Rp 250.000 / bulan", "Donasi rutin program masyarakat Rp 500.000 / bulan", "Budget santunan anak yatim Rp 300.000 / bulan", "Budget kas kegiatan dakwah/sosial Rp 200.000 / bulan"]
          }
        };

        return (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Pilih area & tetapkan target <span className="font-bold text-amber-600">(maks. 3 area)</span></p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedAreas.length >= 3 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}>{selectedAreas.length}/3</span>
            </div>

            {/* Area List with inline target editor */}
            <div className="space-y-2">
              {AREA_LIST.map(area => {
                const Icon = area.icon;
                const isSelected = selectedAreas.includes(area.id);
                const isOpen = isSelected && openAreaEditor === area.id;
                const targetData = areaTargetsMap[area.id] || { mainTarget: "", targetAlasan: "", kualitas: "", kuantitas: "", kuantitasBaseline: "", waktu: "", biaya: "" };
                const hasTarget = targetData.mainTarget && targetData.mainTarget.trim().length > 0;
                const shortcuts = shortcutsByArea[area.id] || shortcutsByArea["Spiritual Growth"];

                return (
                  <div key={area.id} className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                    isOpen ? "border-amber-300 shadow-sm" :
                    isSelected ? "border-slate-200" :
                    "border-slate-100"
                  }`}>
                    {/* Area row — click row to open editor, click checkbox to select/unselect */}
                    <div
                      onClick={() => {
                        if (locked) return;
                        if (!isSelected) {
                          if (selectedAreas.length >= 3) return;
                          toggleArea(area.id);
                          setOpenAreaEditor(area.id);
                          if (!areaTargetsMap[area.id]) {
                            setAreaTargetsMap(prev => ({ ...prev, [area.id]: { mainTarget: "", targetAlasan: "", kualitas: "", kuantitas: "", kuantitasBaseline: "", waktu: "", biaya: "" } }));
                          }
                        } else {
                          setOpenAreaEditor(isOpen ? "" : area.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                        isSelected ? "bg-white" : "bg-white"
                      } ${!isSelected && selectedAreas.length >= 3 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                         isSelected ? "text-white" :
                         "bg-slate-100 text-slate-500"
                       }`} style={isSelected ? { backgroundColor: area.color } : undefined}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${isSelected ? "text-navy-900" : "text-slate-600"}`}>{area.label}</p>
                        {hasTarget && isSelected
                          ? <p className="text-xs text-slate-400 mt-0.5 truncate">{targetData.mainTarget}</p>
                          : <p className={`text-xs mt-0.5 ${isSelected ? "text-slate-400" : "text-slate-400 opacity-70"}`}>{area.desc}</p>
                        }
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {isSelected && hasTarget && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">✓ Target</span>}
                        {isSelected && !hasTarget && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Isi target</span>}
                        
                        {/* Interactive Checkbox Toggle (Click to uncheck when selected) */}
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (locked) return;
                              toggleArea(area.id);
                              if (openAreaEditor === area.id) setOpenAreaEditor("");
                            }}
                            title="Klik untuk uncheck / batal pilih area ini"
                            className="h-6 w-6 rounded-md bg-emerald-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-2xs group"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3] group-hover:hidden" />
                            <X className="h-3.5 w-3.5 stroke-[3] hidden group-hover:block" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (locked || selectedAreas.length >= 3) return;
                              toggleArea(area.id);
                              setOpenAreaEditor(area.id);
                            }}
                            disabled={locked || selectedAreas.length >= 3}
                            title="Pilih area ini"
                            className="h-6 w-6 rounded-md border-2 border-slate-300 hover:border-amber-500 flex items-center justify-center transition-colors bg-white"
                          />
                        )}

                        {isSelected && (
                          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                        )}
                      </div>
                    </div>

                    {/* Inline target editor — only for selected + open area */}
                    {isOpen && (
                      <div className="border-t border-amber-100 bg-[#FAF8F4] px-4 py-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                          <p className="text-xs font-extrabold text-[#0B2C6B] uppercase tracking-wider">Target & Indikator: {area.label}</p>
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => { toggleArea(area.id); setOpenAreaEditor(""); }}
                              className="text-[11px] font-semibold text-slate-500 hover:text-red-600 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 hover:bg-red-50"
                            >
                              <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-600" />
                              Batal Pilih Area
                            </button>
                          )}
                        </div>

                        {/* Main target */}
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 relative">
                            <p className="text-sm font-bold text-slate-700">Sasaran Utama (90 Hari)</p>
                            <button type="button" onMouseEnter={() => setShowSmartTooltip(true)} onMouseLeave={() => setShowSmartTooltip(false)} onClick={() => setShowSmartTooltip(v => !v)} className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center shrink-0">
                              <Info className="h-3 w-3" />
                            </button>
                            {showSmartTooltip && (
                              <div className="absolute left-0 top-7 z-50 bg-navy-900 text-white text-xs rounded-xl p-3.5 shadow-xl w-64 border border-amber-400/30">
                                <p className="font-extrabold text-amber-300 mb-1">💡 Panduan SMART:</p>
                                <p className="opacity-90 leading-relaxed text-[11px]"><strong>S</strong>pecific · <strong>M</strong>easurable · <strong>A</strong>chievable · <strong>R</strong>elevant · <strong>T</strong>ime-bound.</p>
                              </div>
                            )}
                          </div>
                          <Textarea disabled={locked} value={targetData.mainTarget} onChange={e => updateField(area.id, "mainTarget", e.target.value)} placeholder="Contoh: Konsisten sholat 5 waktu berjamaah..." className="min-h-[80px] w-full text-xs sm:text-sm resize-y border-warm-border focus:border-amber-400 rounded-xl bg-white placeholder:italic p-3" maxLength={500} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-1.5">Mengapa sasaran ini penting?</p>
                          <Textarea disabled={locked} value={targetData.targetAlasan} onChange={e => updateField(area.id, "targetAlasan", e.target.value)} placeholder="Apa motivasi terdalam Anda?" className="min-h-[60px] w-full text-xs sm:text-sm resize-y border-warm-border focus:border-amber-400 rounded-xl bg-white placeholder:italic p-3" maxLength={300} />
                        </div>

                        {/* 4 Dimension indicators (Flexible / Optional per relevance) */}
                        <div className="space-y-3 pt-1">
                          <div className="border-t border-[#EAE5D9] pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <p className="text-xs font-bold text-[#071A33]">Indikator Keberhasilan (4 Dimensi)</p>
                            <p className="text-[11px] text-slate-500 italic">Isi dimensi yang paling relevan dengan sasaran Anda (opsional)</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* 1. Kualitas */}
                            <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="text-xs font-extrabold text-purple-800">1. Indikator Kualitas</span>
                                  <div className="group relative cursor-pointer ml-auto">
                                    <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 transition-colors" />
                                    <div className="absolute right-0 bottom-6 hidden group-hover:block z-[9999] bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-56 border border-purple-400/30 pointer-events-none">
                                      <p className="font-bold text-purple-300 mb-0.5">Rumus Skor Kualitas:</p>
                                      <p className="opacity-90 leading-tight">Diukur dengan Rating 1–5 Bintang pada Monitoring.<br/><span className="font-mono text-purple-200 block mt-1">Skor % = Bintang × 20%</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Textarea disabled={locked} value={targetData.kualitas} onChange={e => updateField(area.id, "kualitas", e.target.value)} placeholder="Contoh: Sholat khusyu, tumakninah & selesai dzikir..." className="min-h-[56px] w-full text-xs border-slate-200 focus:border-purple-400 rounded-lg p-2.5 resize-y placeholder:italic" />
                            </div>

                            {/* 2. Kuantitas */}
                            <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="text-xs font-extrabold text-blue-800">2. Indikator Kuantitas</span>
                                  <div className="group relative cursor-pointer ml-auto">
                                    <Info className="h-3.5 w-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                                    <div className="absolute right-0 bottom-6 hidden group-hover:block z-[9999] bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-60 border border-blue-400/30 pointer-events-none">
                                      <p className="font-bold text-blue-300 mb-0.5">Rumus Skor Kuantitas:</p>
                                      <p className="opacity-90 leading-tight">Perbandingan progres dari posisi awal (Baseline) ke Target 90 hari.<br/><span className="font-mono text-blue-200 block mt-1">Skor % = |Realisasi - Baseline| ÷ |Target - Baseline| × 100%</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Baseline (Awal)</label>
                                  <Input disabled={locked} value={targetData.kuantitasBaseline || ""} onChange={e => updateField(area.id, "kuantitasBaseline", e.target.value)} placeholder="Contoh: 1 Juz / bln" className="text-xs border-slate-200 focus:border-blue-400 rounded-lg h-8 bg-slate-50/50 placeholder:italic w-full" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-blue-600 block mb-0.5">Target 90 Hari</label>
                                  <Input disabled={locked} value={targetData.kuantitas} onChange={e => updateField(area.id, "kuantitas", e.target.value)} placeholder="Contoh: 13 Juz (Khatam)" className="text-xs border-slate-200 focus:border-blue-400 rounded-lg h-8 placeholder:italic w-full" />
                                </div>
                              </div>
                            </div>

                            {/* 3. Waktu */}
                            <div className="bg-white p-3.5 rounded-xl border border-amber-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="text-xs font-extrabold text-amber-800">3. Indikator Waktu</span>
                                  <div className="group relative cursor-pointer ml-auto">
                                    <Info className="h-3.5 w-3.5 text-amber-400 hover:text-amber-600 transition-colors" />
                                    <div className="absolute right-0 bottom-6 hidden group-hover:block z-[9999] bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-56 border border-amber-400/30 pointer-events-none">
                                      <p className="font-bold text-amber-300 mb-0.5">Rumus Skor Waktu:</p>
                                      <p className="opacity-90 leading-tight">Persentase jumlah hari konsistensi jadwal tepat waktu dalam 30 hari.<br/><span className="font-mono text-amber-200 block mt-1">Skor % = Hari Tepat Waktu ÷ 30 × 100%</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Textarea disabled={locked} value={targetData.waktu} onChange={e => updateField(area.id, "waktu", e.target.value)} placeholder="Contoh: Hadir di masjid 10 menit sebelum adzan..." className="min-h-[56px] w-full text-xs border-slate-200 focus:border-amber-400 rounded-lg p-2.5 resize-y placeholder:italic" />
                            </div>

                            {/* 4. Biaya */}
                            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="text-xs font-extrabold text-emerald-800">4. Indikator Biaya / Finansial</span>
                                  <div className="group relative cursor-pointer ml-auto">
                                    <Info className="h-3.5 w-3.5 text-emerald-400 hover:text-emerald-600 transition-colors" />
                                    <div className="absolute right-0 bottom-6 hidden group-hover:block z-[9999] bg-navy-900 text-white text-[11px] rounded-xl p-2.5 shadow-xl w-56 border border-emerald-400/30 pointer-events-none">
                                      <p className="font-bold text-emerald-300 mb-0.5">Rumus Skor Biaya:</p>
                                      <p className="opacity-90 leading-tight">Capaian nominal realisasi dibanding nominal target.<br/><span className="font-mono text-emerald-200 block mt-1">Skor % = Realisasi ÷ Target × 100%</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Textarea disabled={locked} value={targetData.biaya} onChange={e => updateField(area.id, "biaya", e.target.value)} placeholder="Contoh: Budget Rp 20.000 / hari via transfer infak..." className="min-h-[56px] w-full text-xs border-slate-200 focus:border-emerald-400 rounded-lg p-2.5 resize-y placeholder:italic" />
                            </div>
                          </div>
                        </div>

                        {/* Deselect area */}
                        {!locked && (
                          <button type="button" onClick={() => { toggleArea(area.id); setOpenAreaEditor(""); }} className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors">
                            ✕ Batal pilih area ini
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 4: {
        if (selectedAreas.length === 0) {
          return (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-center space-y-3 shadow-2xs">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs border border-amber-200/60">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-navy-900">Area Transformasi Belum Dipilih</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Untuk menyusun Action Plan (Habit Engine), Anda wajib memilih minimal 1 Area Transformasi terlebih dahulu di Step 3.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setActiveSection(3)}
                  className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-sm inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 text-amber-400" />
                  <span>Kembali ke Step 3 (Area Transformasi)</span>
                </Button>
              </div>
            </div>
          );
        }

        const habitRecommendations: Record<string, { title: string; freq: string; qty: number }[]> = {
          "Spiritual Growth": [
            { title: "Tilawah Al-Qur'an", freq: "Harian", qty: 1 },
            { title: "Sholat Tahajud", freq: "Pekanan", qty: 2 },
            { title: "Dzikir Pagi & Petang", freq: "Harian", qty: 1 },
            { title: "Sedekah Subuh", freq: "Harian", qty: 1 },
          ],
          "Personal Development": [
            { title: "Membaca Buku 15 Mnt", freq: "Harian", qty: 1 },
            { title: "Olahraga 30 Mnt", freq: "Pekanan", qty: 3 },
            { title: "Digital Detox (Jam 21:00)", freq: "Harian", qty: 1 },
          ],
          "Leadership Excellence": [
            { title: "Daily Standup & Check-in Tim", freq: "Harian", qty: 1 },
            { title: "Review Target & Evaluasi Pekanan", freq: "Pekanan", qty: 1 },
            { title: "Belajar Skill / Reading Report", freq: "Pekanan", qty: 2 },
          ],
          "Relationship": [
            { title: "Quality Time Keluarga", freq: "Pekanan", qty: 1 },
            { title: "Sapa & Silaturahim Sahabat", freq: "Pekanan", qty: 1 },
            { title: "Mendengar & Apresiasi Keluarga", freq: "Harian", qty: 1 },
          ],
          "Community Impact": [
            { title: "Sedekah Berbagi / Infak Jumat", freq: "Pekanan", qty: 1 },
            { title: "Mengajar / Sharing Edukasi Komunitas", freq: "Pekanan", qty: 1 },
          ],
        };

        const activeAreasList = selectedAreas;

        return (
          <div className="space-y-5">
            <div className="bg-[#071A33] border border-amber-400/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1.5">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                Action Plan & Habit Engine
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Tetapkan kebiasaan rutin yang akan Anda jalankan. Kebiasaan ini akan dipantau secara berkala dalam sistem Monitoring 90 Hari.
              </p>
            </div>

            {/* Custom Action Plan Form Toggle */}
            {!locked && (
              <div>
                {!showAddHabit ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddHabit(true);
                      if (activeAreasList.length > 0 && !newActionArea) {
                        setNewActionArea(activeAreasList[0]);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 text-amber-800 font-bold text-xs sm:text-sm rounded-2xl hover:bg-amber-50/70 transition-colors bg-white shadow-2xs"
                  >
                    <Plus className="h-4 w-4 text-amber-600" />
                    <span>Buat Action Plan Custom Baru</span>
                  </button>
                ) : (
                  <div className="border border-amber-200/80 bg-[#FAF8F4] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <p className="text-xs font-extrabold text-[#0B2C6B] uppercase tracking-wider">Form Action Plan Custom</p>
                      <button
                        type="button"
                        onClick={() => { setShowAddHabit(false); setNewActionTitle(""); }}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Nama Kebiasaan / Action Plan</label>
                      <Input
                        value={newActionTitle}
                        onChange={e => setNewActionTitle(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addActionPlan()}
                        placeholder="Contoh: Tahajud 4 Rakaat, Sedekah Subuh, Baca Buku 15 Mnt..."
                        className="text-xs sm:text-sm border-slate-200 focus:border-amber-400 rounded-xl h-10 bg-white placeholder:italic"
                        autoFocus
                      />
                    </div>

                    {/* Grid Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Target Kuantitas */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Target Kuantitas</label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNewActionQty(Math.max(1, newActionQty - 1))}
                            className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-base flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-2xs"
                          >
                            -
                          </button>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={newActionQty === 0 ? "" : newActionQty}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === "") setNewActionQty(0);
                              else {
                                const parsed = parseInt(val, 10);
                                if (!isNaN(parsed)) setNewActionQty(Math.max(0, parsed));
                              }
                            }}
                            onBlur={() => { if (!newActionQty || newActionQty < 1) setNewActionQty(1); }}
                            className="text-xs sm:text-sm border-slate-200 focus:border-amber-400 rounded-xl h-10 bg-white font-extrabold text-center w-full min-w-[45px]"
                          />
                          <button
                            type="button"
                            onClick={() => setNewActionQty(newActionQty + 1)}
                            className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-base flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-2xs"
                          >
                            +
                          </button>
                          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap pl-1">
                            {newActionFreq === "Harian" ? "x/hari" : "x/minggu"}
                          </span>
                        </div>
                        {/* Quick quantity shortcuts directly under Target Kuantitas */}
                        <div className="flex items-center gap-1 pt-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400">Pilih Cepat:</span>
                          {[1, 2, 3, 5, 7].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setNewActionQty(num)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                                newActionQty === num
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                              }`}
                            >
                              {num}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Frequency Pill Selection */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Frekuensi Target</label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setNewActionFreq("Harian")}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              newActionFreq === "Harian" ? "bg-white text-amber-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <Sun className="h-3.5 w-3.5" />
                            <span>Harian</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewActionFreq("Pekanan")}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              newActionFreq === "Pekanan" ? "bg-white text-amber-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Pekanan</span>
                          </button>
                        </div>
                      </div>

                      {/* Area Category */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Kategori Area</label>
                        <select
                          value={newActionArea || activeAreasList[0]}
                          onChange={e => setNewActionArea(e.target.value)}
                          className="w-full border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-3 text-xs font-bold text-navy-900 bg-white h-10 shadow-2xs cursor-pointer"
                        >
                          {activeAreasList.map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/50">
                      <Button variant="outline" type="button" onClick={() => { setShowAddHabit(false); setNewActionTitle(""); }} className="rounded-xl h-9 px-4 border-slate-200 text-xs font-semibold">
                        Batal
                      </Button>
                      <Button type="button" onClick={addActionPlan} className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl h-9 px-5 font-bold text-xs shadow-sm flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Simpan Action Plan</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of Registered Action Plans */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">Daftar Action Plan Terdaftar ({actionPlans.length})</p>
                {actionPlans.length > 0 && (
                  <Badge variant="success" className="text-[11px] font-bold py-0.5 px-2.5">
                    ✓ {actionPlans.length} kebiasaan siap dipantau
                  </Badge>
                )}
              </div>

              {actionPlans.length === 0 && (
                <div className="text-center py-10 px-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs border border-amber-200/60">
                    <Zap className="h-5 w-5 text-amber-500 fill-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-navy-900">Belum ada action plan yang ditambahkan</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Klik tombol &quot;Buat Action Plan Custom Baru&quot; di atas untuk menambahkan kebiasaan Anda.
                  </p>
                </div>
              )}

              {actionPlans.map((ap, idx) => {
                const { bg, iconColor, Icon } = getHabitStyle(ap.title);
                const areaCategory = ap.area_category || "Spiritual Growth";
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 p-3.5 bg-white border border-warm-border rounded-2xl shadow-2xs hover:border-amber-300 transition-all group"
                  >
                    <div className={`h-10 w-10 rounded-xl ${bg} ${iconColor} flex items-center justify-center shrink-0 shadow-2xs`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-navy-900 leading-tight">{ap.title}</p>
                        {locked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-slate-50 text-slate-700 border-slate-200">
                            {areaCategory}
                          </span>
                        ) : (
                          <select
                            value={areaCategory}
                            onChange={(event) => updateActionPlanArea(idx, event.target.value)}
                            className="max-w-[190px] rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 focus:border-amber-400 focus:outline-none"
                            aria-label={`Area transformasi untuk ${ap.title}`}
                          >
                            {selectedAreas.map(area => <option key={area} value={area}>{area}</option>)}
                          </select>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Target: <span className="font-extrabold text-navy-900">{ap.quantity || 1}x</span> {ap.frequency?.toLowerCase() === "pekanan" ? "per minggu (Pekanan)" : "per hari (Harian)"}
                      </p>
                    </div>

                    {!locked && (
                      <button
                        type="button"
                        onClick={() => removeActionPlan(idx)}
                        title="Hapus action plan ini"
                        className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors border border-slate-100 hover:border-red-200 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
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
        {sectionNum === 4 && actionPlans.length > 0 && (
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
      <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
        <Sparkles className="h-8 w-8 text-amber-500" />
      </div>
      <h2 className="text-2xl font-black text-navy-900 mb-2">Journey Setup Selesai!</h2>
      <p className="text-slate-500 text-sm mb-5 max-w-xs">Personal Transformation Project perjalanan Anda telah selesai disimpan.</p>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-2 ${ptpStatus === "LOCKED" ? "bg-navy-100 text-navy-700 border border-navy-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
        {ptpStatus === "LOCKED" ? <Lock className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
        Status Personal Transformation Project: {ptpStatus}
      </div>
      {ptpStatus === "EDITABLE" && <p className="text-xs text-slate-400 mb-6 max-w-xs">PTP masih dapat diperbarui hingga Admin mengunci Personal Transformation Project.</p>}
      <div className="w-full max-w-sm bg-white border border-warm-border rounded-2xl p-4 shadow-2xs mb-6 text-left">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ringkasan Personal Transformation Project Anda</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center"><span className="text-sm text-slate-600">4 Bagian</span><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Selesai</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Terakhir diubah</span><span className="text-sm font-semibold text-navy-900">{lastSaved ? `Hari ini, ${lastSaved.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Baru saja"}</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Coach</span><span className="text-sm font-semibold text-navy-900 truncate max-w-[150px]">{coachName}</span></div>
        </div>
      </div>
      <Button onClick={() => router.push("/dashboard")} className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl h-11 px-8 font-bold shadow-lg">Kembali ke Dashboard</Button>
    </div>
  );

  const renderPageAlert = () => (loadError || saveError) ? (
    <div role="alert" className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 lg:mx-0">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1 whitespace-pre-line">{loadError || saveError}</span>
      <button type="button" onClick={() => { setLoadError(null); setSaveError(null); }} className="text-rose-400 hover:text-rose-700" aria-label="Tutup pesan">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  ) : null;

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
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Status Personal Transformation Project</span>
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
      <div className={`p-4 border-b border-warm-border flex items-center ${desktopNavCollapsed ? "justify-center" : "justify-between"} gap-2`}>
        {!desktopNavCollapsed && (
          <div>
            <h2 className="text-base font-black text-navy-900 leading-tight">Journey Setup</h2>
            <p className="text-xs text-slate-400 mt-0.5">PTP 90 Hari</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setDesktopNavCollapsed(v => !v)}
          title={desktopNavCollapsed ? "Perluas Panel Sidebar" : "Kecilkan Sidebar (Lebih Luas)"}
          className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 transition-colors shrink-0"
        >
          {desktopNavCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {!desktopNavCollapsed && (
        <div className="p-4 border-b border-warm-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-navy-900">{progressPct}% Selesai</span>
            {estimatedMinutes > 0 && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />~{estimatedMinutes} mnt</span>}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{completedCount} dari {SECTIONS.length} langkah selesai</p>
        </div>
      )}

      <div className="flex-1 p-2 space-y-1">
        {SECTIONS.map(sec => {
          const status = getSectionStatus(sec.num);
          const isActive = activeSection === sec.num;
          return (
            <button
              key={sec.num}
              onClick={() => setActiveSection(sec.num)}
              title={desktopNavCollapsed ? `${sec.num}. ${sec.title}` : undefined}
              className={`w-full flex items-center ${desktopNavCollapsed ? "justify-center px-0 py-3" : "gap-3 p-3 text-left"} rounded-xl transition-all ${
                isActive ? "bg-amber-50 border-2 border-amber-300 shadow-xs" : "hover:bg-slate-50 border-2 border-transparent"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-colors ${
                status === "completed" || isActive ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {status === "completed" ? <Check className="h-4 w-4" /> : sec.num}
              </div>
              {!desktopNavCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${isActive ? "text-amber-700" : "text-navy-900"}`}>{sec.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{sec.subtitle}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-500" : "text-slate-300"}`} />
                </>
              )}
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

      {renderPageAlert()}

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
          <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* FIXED TOP HEADER */}
            <div className="shrink-0 bg-white border-b border-warm-border">
              <div className="px-4 pt-3.5 pb-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-navy-900 mb-2.5 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-amber-500" />
                  <span>Kembali ke Home</span>
                </button>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-black text-navy-900 leading-tight">Journey Setup</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Personal Transformation Project 90 Hari</p>
                  </div>
                  <span className={`shrink-0 font-bold px-2.5 py-1 rounded-full text-[11px] mt-0.5 inline-flex items-center gap-1 ${ptpStatus === "LOCKED" ? "bg-navy-100 text-navy-700" : "bg-amber-100 text-amber-700"}`}>
                    {ptpStatus === "LOCKED" ? <><Lock className="h-3 w-3" />Locked</> : <><Edit3 className="h-3 w-3" />Editable</>}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-navy-900">{progressPct}% Selesai</span>
                  {estimatedMinutes > 0 && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />~{estimatedMinutes} mnt tersisa
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{completedCount} dari {SECTIONS.length} langkah selesai · Hari ke-{dayCount} dari 90</p>
              </div>
            </div>

            {/* SCROLLABLE SECTION LIST */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="px-4 pt-3 pb-6 space-y-2">
                {SECTIONS.map(sec => {
                  const status = getSectionStatus(sec.num);
                  const isCompleted = status === "completed";
                  const isInProgress = status === "in-progress";
                  return (
                    <button
                      key={sec.num}
                      onClick={() => { setActiveSection(sec.num); setMobileView("editor"); }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all border-2 ${
                        isInProgress
                          ? "bg-amber-50 border-amber-300 shadow-sm"
                          : isCompleted
                          ? "bg-white border-slate-200 hover:border-amber-200"
                          : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
                        isCompleted ? "bg-amber-500 text-white" :
                        isInProgress ? "bg-amber-500 text-white ring-4 ring-amber-100" :
                        "bg-slate-100 text-slate-400"
                      }`}>
                        {isCompleted ? <Check className="h-4 w-4" /> : sec.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-tight ${
                          isInProgress ? "text-amber-800" : isCompleted ? "text-slate-700" : "text-navy-900"
                        }`}>{sec.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">{sec.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCompleted && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">✓</span>}
                        {isInProgress && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Aktif</span>}
                        <ChevronRight className={`h-4 w-4 ${isInProgress ? "text-amber-500" : "text-slate-300"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
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
                <button onClick={() => setMobileView("navigator")} className="flex items-center gap-1.5 text-sm text-slate-600 font-semibold hover:text-navy-900">
                  <ArrowLeft className="h-4 w-4 text-amber-500" />
                  <span>Semua Langkah</span>
                </button>
                <button onClick={() => setMobileView("tips")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  <Info className="h-3.5 w-3.5" />
                  <span>Tips</span>
                </button>
              </div>

              {/* Step dots */}
              <div className="bg-slate-50 border-t border-warm-border px-4 py-2.5 flex items-center justify-between">
                <StepDots />
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">STEP {activeSection} OF {SECTIONS.length}</span>
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
                {activeSection === SECTIONS.length ? "Selesai ✓" : "Selanjutnya"}<ArrowRight className="h-4 w-4" />
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
          {/* Left panel: Section Navigator (Collapsible) */}
          <div className={`border-r border-warm-border shrink-0 overflow-y-auto bg-white transition-all duration-300 ${desktopNavCollapsed ? "w-16" : "w-72 xl:w-80"}`}>
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
                      <span className="text-sm">{activeSection === SECTIONS.length ? "Selesai ✓" : "Selanjutnya"}</span><ArrowRight className="h-4 w-4" />
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
