"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Star,
  Target,
  Clock,
  Activity,
  Calendar,
  MessageSquare,
  Flame,
  Edit3,
  Lightbulb,
  BookOpen,
  BarChart2,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import Link from "next/link";

interface MonthlyReviewItem {
  id?: string;
  monthNumber: 1 | 2 | 3;
  status: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  participantNote: string;
  coachNote?: string;
  coachRepliedAt?: string;
}

interface AreaIndicatorTargets {
  mainTarget: string;
  kualitas: string;
  kuantitas: string;
  waktu: string;
  biaya: string;
}

interface AreaReport {
  area: string;
  targets: AreaIndicatorTargets;
  kualitasRating: number;
  kuantitasBaseline: string;
  kuantitasActual: string;
  waktuActualDays: string;
  biayaActual: string;
  isSaved?: boolean;
  baselineScore?: number;
}

// ── Formula Calculation Functions ──────────────────────────────────────────

function calcKuantitasScore(baseline: string, target: string, actual: string): number {
  const b = parseFloat(baseline);
  const t = parseFloat(target);
  const a = parseFloat(actual);
  if (isNaN(b) || isNaN(t) || isNaN(a) || Math.abs(t - b) < 0.001) return 0;
  const pct = (Math.abs(a - b) / Math.abs(t - b)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function calcWaktuScore(actualDays: string): number {
  const d = parseFloat(actualDays);
  if (isNaN(d)) return 0;
  return Math.min(100, Math.round((d / 30) * 100));
}

function calcBiayaScore(biayaTarget: string, biayaActual: string): number {
  const t = parseFloat(biayaTarget.replace(/[^0-9.]/g, ""));
  const a = parseFloat(biayaActual.replace(/[^0-9.]/g, ""));
  if (isNaN(t) || isNaN(a) || t === 0) return 0;
  return Math.min(100, Math.round((a / t) * 100));
}

function calcAreaScore(rep: AreaReport): number {
  if (!rep.isSaved) {
    return rep.baselineScore !== undefined ? rep.baselineScore : 0;
  }
  const scores: number[] = [];
  if (rep.targets.kualitas) scores.push(rep.kualitasRating * 20);
  if (rep.targets.kuantitas && rep.kuantitasBaseline && rep.kuantitasActual)
    scores.push(calcKuantitasScore(rep.kuantitasBaseline, rep.targets.kuantitas, rep.kuantitasActual));
  if (rep.targets.waktu && rep.waktuActualDays) scores.push(calcWaktuScore(rep.waktuActualDays));
  if (rep.targets.biaya && rep.biayaActual) scores.push(calcBiayaScore(rep.targets.biaya, rep.biayaActual));
  if (scores.length === 0) return rep.kualitasRating * 20;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Unified SLJ Brand Color Mapping
const AREA_COLORS: Record<string, string> = {
  "Spiritual Growth": "#D97706", // Gold / Amber
  "Personal Development": "#0B2C6B", // Navy
  "Leadership Excellence": "#071A33", // Dark Navy
  "Leadership/Profesional Excellence": "#071A33",
  "Leadership / Professional Excellence": "#071A33",
  "Family Bonding": "#D97706",
  "Community Impact": "#059669", // Emerald
  "Health & Wellbeing": "#10B981",
};

export default function MonitoringPage() {
  const supabase = createClient();

  const [userName, setUserName] = useState("Peserta SLJ");
  const [dayCount, setDayCount] = useState(1);
  const [coachName, setCoachName] = useState("Coach Pendamping");
  const [selectedMonth, setSelectedMonth] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"ON_TRACK" | "NEED_SUPPORT">("ON_TRACK");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState<Record<number, MonthlyReviewItem>>({
    1: { monthNumber: 1, status: "NOT_FILLED", participantNote: "" },
    2: { monthNumber: 2, status: "NOT_FILLED", participantNote: "" },
    3: { monthNumber: 3, status: "NOT_FILLED", participantNote: "" },
  });

  const [finalReflection, setFinalReflection] = useState("");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [areaReports, setAreaReports] = useState<Record<number, Record<string, AreaReport>>>({
    1: {}, 2: {}, 3: {},
  });

  const [savingReflection, setSavingReflection] = useState(false);
  const [savedReflection, setSavedReflection] = useState(false);
  const [savingArea, setSavingArea] = useState<string | null>(null);

  // Timeframe filter state: '1d' | '7d' | '1m' | '3m'
  const [timeframe, setTimeframe] = useState<"1d" | "7d" | "1m" | "3m">("7d");
  const [chartData, setChartData] = useState<{ day: string; scores: Record<string, number> }[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ date: string; level: number; pct: number }[]>([]);
  const [habitConsistencyPct, setHabitConsistencyPct] = useState<number>(0);

  // Modal Drawer for 4-Dimension Indicator Update
  const [editingAreaModal, setEditingAreaModal] = useState<string | null>(null);

  // ── Load Data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile & Day Count
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (profile) {
        setUserName(profile.full_name || "Peserta SLJ");
        if (profile.start_date) {
          const startD = new Date(profile.start_date);
          const diff = Math.floor((Date.now() - startD.getTime()) / 86400000);
          setDayCount(Math.max(1, diff + 1));
        }
      }

      // Monthly reviews
      const { data: revData } = await supabase.from("monthly_reviews").select("*").eq("user_id", user.id);
      const revMap: Record<number, MonthlyReviewItem> = {
        1: { monthNumber: 1, status: "NOT_FILLED", participantNote: "" },
        2: { monthNumber: 2, status: "NOT_FILLED", participantNote: "" },
        3: { monthNumber: 3, status: "NOT_FILLED", participantNote: "" },
      };
      (revData || []).forEach((r: any) => {
        if (r.month_number >= 1 && r.month_number <= 3) {
          revMap[r.month_number] = {
            id: r.id,
            monthNumber: r.month_number,
            status: r.status,
            participantNote: r.participant_note || "",
            coachNote: r.coach_note || "",
            coachRepliedAt: r.coach_replied_at || "",
          };
        }
      });
      setReviews(revMap);
      setStatus(revMap[selectedMonth]?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
      setNote(revMap[selectedMonth]?.participantNote || "");

      // Journey (areas + targets)
      const { data: journey } = await supabase.from("journeys")
        .select("id, area_transformasi, main_target, final_reflection")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();

      if (!journey) { setLoading(false); return; }

      setJourneyId(journey.id);
      setFinalReflection(journey.final_reflection || "");

      const areas: string[] = Array.isArray(journey.area_transformasi) ? journey.area_transformasi : [];
      setSelectedAreas(areas);

      // Support Team / Coach
      const { data: team } = await supabase.from("support_team").select("coach_name").eq("journey_id", journey.id).maybeSingle();
      if (team?.coach_name) setCoachName(team.coach_name);

      // Parse targets per-area from journey.main_target JSON
      const targetsMap: Record<string, AreaIndicatorTargets & { kuantitasBaseline?: string }> = {};
      try {
        const parsed = JSON.parse(journey.main_target || "{}");
        if (parsed && typeof parsed === "object") {
          areas.forEach(area => {
            const d = parsed[area] || {};
            targetsMap[area] = {
              mainTarget: d.mainTarget || d.target || "",
              kualitas: d.kualitas || "",
              kuantitas: d.kuantitas || "",
              kuantitasBaseline: d.kuantitasBaseline || "",
              waktu: d.waktu || "",
              biaya: d.biaya || "",
            };
          });
        }
      } catch {}

      // Fetch Baseline Assessment Answers if available
      const { data: bAnswers } = await supabase.from("baseline_answers")
        .select("area, score").eq("user_id", user.id);
      
      const baselineScoresMap: Record<string, number> = {};
      if (bAnswers && bAnswers.length > 0) {
        const areaSums: Record<string, { sum: number; count: number }> = {};
        bAnswers.forEach((ans: any) => {
          const aKey = ans.area;
          if (!areaSums[aKey]) areaSums[aKey] = { sum: 0, count: 0 };
          areaSums[aKey].sum += ans.score;
          areaSums[aKey].count += 1;
        });

        // Map area DB enum keys to PTP Area titles
        const keyMapping: Record<string, string> = {
          spiritual_growth: "Spiritual Growth",
          personal_development: "Personal Development",
          leadership_excellence: "Leadership Excellence",
          relationship: "Relationship",
          community_impact: "Community Impact",
        };

        Object.entries(areaSums).forEach(([aKey, val]) => {
          const title = keyMapping[aKey] || aKey;
          baselineScoresMap[title] = Math.round((val.sum / (val.count * 10)) * 100);
        });
      }

      // Load saved monthly_indicator_reports
      const { data: indReports } = await supabase.from("monthly_indicator_reports")
        .select("*").eq("user_id", user.id);

      const newReports: Record<number, Record<string, AreaReport>> = { 1: {}, 2: {}, 3: {} };
      areas.forEach(area => {
        [1, 2, 3].forEach(month => {
          const saved = (indReports || []).find((r: any) => r.month_number === month && r.area === area);
          const ptpBaseline = targetsMap[area]?.kuantitasBaseline || "";
          const bScore = baselineScoresMap[area];
          newReports[month][area] = saved
            ? {
                area,
                targets: targetsMap[area] || { mainTarget: "", kualitas: "", kuantitas: "", waktu: "", biaya: "" },
                kualitasRating: saved.kualitas_actual_rating || 4,
                kuantitasBaseline: saved.kuantitas_baseline?.toString() || ptpBaseline,
                kuantitasActual: saved.kuantitas_actual?.toString() || "",
                waktuActualDays: saved.waktu_actual_days?.toString() || "",
                biayaActual: saved.biaya_actual?.toString() || "",
                isSaved: true,
                baselineScore: bScore,
              }
            : buildEmptyReport(area, targetsMap[area] || { mainTarget: "", kualitas: "", kuantitas: "", waktu: "", biaya: "" }, bScore);

          if (!saved && ptpBaseline) {
            newReports[month][area].kuantitasBaseline = ptpBaseline;
          }
        });
      });
      setAreaReports(newReports);

      // Fetch Action Plans
      const { data: actionPlans } = await supabase.from("action_plans")
        .select("id, area_category, quantity").eq("user_id", user.id);

      // Build Dynamic Chart based on timeframe (1d, 7d, 1m, 3m)
      const numDays = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : timeframe === "1m" ? 30 : 90;
      const today = new Date();
      const datesArr: string[] = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        datesArr.push(d.toISOString().split("T")[0]);
      }

      const { data: habitLogs } = await supabase.from("habit_logs")
        .select("habit_id, date, completed, completed_count")
        .eq("user_id", user.id).in("date", datesArr);

      if (actionPlans && actionPlans.length > 0) {
        const sampledDates = numDays > 30 
          ? datesArr.filter((_, idx) => idx % 3 === 0 || idx === datesArr.length - 1)
          : numDays > 7 
          ? datesArr.filter((_, idx) => idx % 2 === 0 || idx === datesArr.length - 1)
          : datesArr;

        const chart = sampledDates.map((dateStr) => {
          const dObj = new Date(dateStr);
          const label = numDays === 1 
            ? "Hari Ini" 
            : numDays <= 7 
            ? dObj.toLocaleDateString("id-ID", { weekday: "short" }) 
            : `${dObj.getDate()}/${dObj.getMonth() + 1}`;
          
          const logsForDay = (habitLogs || []).filter((l: any) => l.date === dateStr);
          const scores: Record<string, number> = {};
          areas.forEach(area => {
            const areaAPs = (actionPlans as any[]).filter(ap => (ap.area_category || "Spiritual Growth") === area);
            if (areaAPs.length === 0) { scores[area] = 0; return; }
            let total = 0;
            areaAPs.forEach(ap => {
              const log = logsForDay.find((l: any) => l.habit_id === ap.id);
              const qty = ap.quantity || 1;
              const cnt = log ? (log.completed_count || (log.completed ? qty : 0)) : 0;
              total += Math.min(1, cnt / qty);
            });
            scores[area] = Math.round((total / areaAPs.length) * 100);
          });
          return { day: label, scores };
        });
        setChartData(chart);
      }

      // Build 90-Day Heatmap Data & Calculate Real Habit Consistency %
      const dates90: string[] = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates90.push(d.toISOString().split("T")[0]);
      }
      const { data: logs90 } = await supabase.from("habit_logs")
        .select("date, completed")
        .eq("user_id", user.id).in("date", dates90);

      const totalAPCount = (actionPlans || []).length || 1;
      let totalCompletedDays = 0;

      const heatmap = dates90.map(dateStr => {
        const dayLogs = (logs90 || []).filter((l: any) => l.date === dateStr && l.completed);
        const pct = Math.round((dayLogs.length / totalAPCount) * 100);
        if (pct >= 50) totalCompletedDays++;
        let level = 0;
        if (pct > 0 && pct < 40) level = 1;
        else if (pct >= 40 && pct < 80) level = 2;
        else if (pct >= 80) level = 3;
        return { date: dateStr, level, pct };
      });
      setHeatmapData(heatmap);

      // Real calculated habit consistency % over active days
      const activeDaysSoFar = Math.min(dayCount, 90);
      const realHabitPct = Math.min(100, Math.round((totalCompletedDays / Math.max(1, activeDaysSoFar)) * 100));
      setHabitConsistencyPct(realHabitPct);

    } catch (err) {
      console.error("Gagal memuat monitoring:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, timeframe]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const buildEmptyReport = (area: string, targets: AreaIndicatorTargets, baselineScore?: number): AreaReport => ({
    area, targets, kualitasRating: 4,
    kuantitasBaseline: "", kuantitasActual: "", waktuActualDays: "", biayaActual: "",
    isSaved: false, baselineScore,
  });

  const handleSelectMonth = (month: 1 | 2 | 3) => {
    setSelectedMonth(month);
    const rev = reviews[month];
    setStatus(rev?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
    setNote(rev?.participantNote || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentReview = reviews[selectedMonth];
      const { data, error } = await supabase.from("monthly_reviews").upsert({
        id: currentReview?.id,
        user_id: user.id, month_number: selectedMonth, status, participant_note: note,
        updated_at: new Date().toISOString(),
      }).select().maybeSingle();
      if (!error && data) {
        setReviews(prev => ({
          ...prev,
          [selectedMonth]: { ...prev[selectedMonth], id: data.id, status, participantNote: note },
        }));
        setSaved(true); setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSaveIndReport = async (area: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !journeyId) return;
    const rep = areaReports[selectedMonth]?.[area];
    if (!rep) return;
    setSavingArea(area);
    const overallPct = calcAreaScore(rep);
    try {
      await supabase.from("monthly_indicator_reports").upsert({
        user_id: user.id, journey_id: journeyId, month_number: selectedMonth, area,
        kualitas_actual_rating: rep.kualitasRating,
        kuantitas_baseline: parseFloat(rep.kuantitasBaseline) || null,
        kuantitas_actual: parseFloat(rep.kuantitasActual) || null,
        waktu_actual_days: parseFloat(rep.waktuActualDays) || null,
        biaya_actual: parseFloat(rep.biayaActual.replace(/[^0-9.]/g, "")) || null,
        score_percentage: overallPct, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,month_number,area" });
    } catch (err) { console.error(err); } finally {
      setTimeout(() => {
        setSavingArea(null);
        setEditingAreaModal(null);
      }, 1200);
    }
  };

  const updateAreaReport = (area: string, field: keyof AreaReport, value: string | number) => {
    setAreaReports(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        [area]: { ...prev[selectedMonth][area], [field]: value },
      },
    }));
  };

  const handleSaveReflection = async () => {
    if (!journeyId) return;
    setSavingReflection(true);
    try {
      await supabase.from("journeys").update({
        final_reflection: finalReflection, updated_at: new Date().toISOString(),
      }).eq("id", journeyId);
      setSavedReflection(true); setTimeout(() => setSavedReflection(false), 2500);
    } catch (err) { console.error(err); } finally { setSavingReflection(false); }
  };

  // Overall Health Score Calculation & Guilt-Free Status Helper
  const calculateHealthScores = () => {
    if (selectedAreas.length === 0) return { overall: 0, areas: {}, highestArea: "", lowestArea: "" };
    let sum = 0;
    const areaScores: Record<string, number> = {};
    let highest = { area: selectedAreas[0] || "", score: -1 };
    let lowest = { area: selectedAreas[0] || "", score: 999 };

    selectedAreas.forEach(area => {
      const rep = areaReports[selectedMonth]?.[area];
      const score = rep ? calcAreaScore(rep) : 0;
      areaScores[area] = score;
      sum += score;

      if (score > highest.score) highest = { area, score };
      if (score < lowest.score) lowest = { area, score };
    });
    const overall = Math.round(sum / selectedAreas.length);
    return { overall, areas: areaScores, highestArea: highest.area, lowestArea: lowest.area };
  };

  const healthData = calculateHealthScores();
  const daysRemaining = Math.max(0, 90 - dayCount);
  const nextCheckpointMonth = dayCount <= 30 ? 1 : dayCount <= 60 ? 2 : 3;
  const daysToNextCheckpoint = dayCount <= 30 ? 30 - dayCount : dayCount <= 60 ? 60 - dayCount : Math.max(0, 90 - dayCount);

  // Proyeksi Kelulusan Real
  const projectedOverallPct = Math.min(100, Math.round((healthData.overall + habitConsistencyPct) / 2));

  // Guilt-Free UX Helper for New Participants (< 7 days or no entries)
  const isEarlyStage = dayCount <= 7;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/monitoring" pageTitle="Monitoring Perjalanan SLJ">
      {/* Full-width container with clean whitespace */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-16 font-sans text-slate-800">
        
        {/* Two-column layout: Left Main Content (70%), Right Analytics & Guidance Sidebar (30%) */}
        <div className="flex flex-col lg:flex-row gap-7 items-start">

          {/* ─── LEFT MAIN CONTENT COLUMN ───────────────────────────────────── */}
          <div className="flex-1 w-full space-y-7 min-w-0">

            {/* ─── 1. HERO BANNER (Solid Dark Navy - No Gradient) ───────────── */}
            <div className="bg-[#071A33] text-white p-6 sm:p-8 rounded-3xl shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Hari ke-{dayCount} dari 90 Hari
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">
                      Evaluasi Bulan Ke-{selectedMonth}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Monitoring Perjalanan {userName.split(" ")[0]}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Evaluasi reflektif progres 90 hari & kedisiplinan habit harian Anda secara konsisten.
                  </p>

                  {/* Progress Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Journey Health Score</span>
                      <span className="font-extrabold text-amber-300">
                        {isEarlyStage && healthData.overall === 0 ? "Awal Perjalanan" : `${healthData.overall}%`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(4, healthData.overall)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Card: Next Checkpoint Widget (Solid Fill) */}
                <div className="bg-white/10 p-4 rounded-2xl shrink-0 w-full md:w-64 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Target Evaluasi</span>
                    <Clock className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">Checkpoint Bulan {nextCheckpointMonth}</p>
                    <p className="text-xs text-amber-300 font-mono font-bold mt-0.5">
                      {daysToNextCheckpoint > 0 ? `${daysToNextCheckpoint} hari lagi` : "Saatnya Evaluasi!"}
                    </p>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-[11px] text-slate-300">
                    <span>Sisa Perjalanan</span>
                    <span className="font-bold text-white">{daysRemaining} Hari</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 2. JOURNEY HEALTH SCORES (Border-free, Left Accent Line) ──── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Journey Health Scores — Bulan {selectedMonth}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {selectedAreas.map(area => {
                  const score = healthData.areas[area] || 0;
                  const color = AREA_COLORS[area] || "#0B2C6B";
                  const rep = areaReports[selectedMonth]?.[area];
                  const hasFilledData = rep && (rep.kuantitasActual || rep.waktuActualDays || rep.biayaActual);

                  return (
                    <div
                      key={area}
                      className="bg-white rounded-2xl p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate max-w-[140px]" style={{ color }}>{area}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black" style={{ color }}>
                          {!hasFilledData && isEarlyStage ? "--" : `${score}%`}
                        </span>

                        {/* Guilt-Free UX Badge: Neutral status if early stage or unsubmitted */}
                        {!hasFilledData && isEarlyStage ? (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Belum ada data
                          </span>
                        ) : score >= 80 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Sangat Baik
                          </span>
                        ) : score >= 50 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            Cukup Baik
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Perlu Fokus
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(3, score)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Real Calculated Habit Consistency Card */}
                <div className="bg-white rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">Habit Consistency</span>
                    <Flame className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-amber-600">
                      {isEarlyStage && habitConsistencyPct === 0 ? "--" : `${habitConsistencyPct}%`}
                    </span>
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {habitConsistencyPct >= 75 ? "Konsisten" : "Berjalan"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(3, habitConsistencyPct)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 3. PROGRESS ANALYTICS & 90-DAY GRID (Border-free) ───────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Dynamic Multi-Timeframe Chart (2 cols) */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Grafik Progress Action Plan
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Tren kedisiplinan habit harian</p>
                  </div>

                  {/* Timeframe Filter Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                    {(["1d", "7d", "1m", "3m"] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          timeframe === tf ? "bg-white text-navy-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tf === "1d" ? "1 Hari" : tf === "7d" ? "7 Hari" : tf === "1m" ? "1 Bulan" : "3 Bulan"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Chart Render */}
                {selectedAreas.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-xs text-slate-400">Belum ada area dipilih di PTP.</p>
                    <Link href="/journey">
                      <Button variant="outline" className="text-xs font-bold rounded-xl border-amber-400">Lengkapi PTP</Button>
                    </Link>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">Belum ada log habit pada rentang waktu ini.</div>
                ) : (
                  <div className="w-full relative bg-slate-50 rounded-xl p-3" style={{ height: 160 }}>
                    {/* SVG Multi-Line */}
                    <svg className="w-full h-full" viewBox={`0 0 ${(chartData.length - 1) * 100} 120`} preserveAspectRatio="none">
                      {selectedAreas.map(area => {
                        const pts = chartData.map((row, i) => [
                          i * 100,
                          120 - ((row.scores[area] || 0) / 100) * 120,
                        ]);
                        const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
                        const color = AREA_COLORS[area] || "#94a3b8";
                        return (
                          <g key={area}>
                            <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={color} />)}
                          </g>
                        );
                      })}
                    </svg>
                    {/* Labels */}
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                      {chartData.map((row, i) => (
                        <span key={i}>{row.day}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
                  {selectedAreas.map(area => (
                    <div key={area} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: AREA_COLORS[area] || "#94a3b8" }} />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 90-Day Grid Heatmap (GitHub Contribution Style with distinct empty boxes) */}
              <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-amber-500" />
                      Grid Istiqamah 90 Hari
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Setiap kotak merepresentasikan pengisian checklist harian Anda.
                  </p>
                </div>

                {/* 90-Day Grid */}
                <div className="grid grid-cols-10 gap-1.5 py-2">
                  {heatmapData.map((item, idx) => (
                    <div
                      key={idx}
                      title={`${item.date}: ${item.pct}% Selesai`}
                      className={`h-4.5 w-4.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${
                        item.level === 3 ? "bg-emerald-600 border border-emerald-700"
                        : item.level === 2 ? "bg-emerald-400 border border-emerald-500"
                        : item.level === 1 ? "bg-emerald-200 border border-emerald-300"
                        : "bg-[#ebedf0] border border-slate-200/80"
                      }`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                  <span>Kurang</span>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 bg-[#ebedf0] border border-slate-200/80 rounded-xs" />
                    <span className="h-2.5 w-2.5 bg-emerald-200 border border-emerald-300 rounded-xs" />
                    <span className="h-2.5 w-2.5 bg-emerald-400 border border-emerald-500 rounded-xs" />
                    <span className="h-2.5 w-2.5 bg-emerald-600 border border-emerald-700 rounded-xs" />
                  </div>
                  <span>Istiqamah</span>
                </div>
              </div>

            </div>

            {/* ─── 4. 3 AREA TRANSFORMATION CARDS (Border-free) ──────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Area Transformasi & Pelaporan Bulanan
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Bulan Ke-{selectedMonth}
                </span>
              </div>

              {selectedAreas.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center space-y-3">
                  <Target className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">Lengkapi PTP Anda untuk memilih area transformasi.</p>
                  <Link href="/journey">
                    <Button variant="outline" className="text-xs font-bold rounded-xl border-amber-400">Ke Halaman PTP</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedAreas.map(area => {
                    const rep = areaReports[selectedMonth]?.[area];
                    const score = rep ? calcAreaScore(rep) : 0;
                    const color = AREA_COLORS[area] || "#0B2C6B";
                    const hasFilledData = rep && (rep.kuantitasActual || rep.waktuActualDays || rep.biayaActual);

                    return (
                      <div
                        key={area}
                        className="bg-white p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-xs font-extrabold text-navy-900">{area}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              !hasFilledData && isEarlyStage
                                ? "bg-slate-100 text-slate-600"
                                : score >= 80 ? "bg-emerald-50 text-emerald-700"
                                : score >= 50 ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {!hasFilledData && isEarlyStage ? "Belum Diisi" : `${score}% Capaian`}
                            </span>
                          </div>

                          {rep?.targets?.mainTarget && (
                            <p className="text-xs text-slate-600 line-clamp-2 italic">
                              &ldquo;{rep.targets.mainTarget}&rdquo;
                            </p>
                          )}

                          {/* 4 Dimensi Non-Contradictory Real Metrics */}
                          <div className="space-y-1.5 pt-1 text-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Rating Target PTP</span>
                              <span className="font-bold text-amber-700">{rep?.targets?.kualitas || "4★ Khusyu"}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Realisasi Kuantitas</span>
                              <span className="font-bold text-navy-900">{rep?.kuantitasActual || "Belum Diisi"}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Waktu Tepat Hari</span>
                              <span className="font-bold text-navy-900">{rep?.waktuActualDays ? `${rep.waktuActualDays}/30 hari` : "Belum Diisi"}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Biaya / Sedekah</span>
                              <span className="font-bold text-emerald-700">{rep?.biayaActual ? `Rp ${rep.biayaActual}` : "Belum Diisi"}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setEditingAreaModal(area)}
                          className="w-full bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-9 flex items-center justify-center gap-2 mt-2"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Input Capaian Bulanan
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── 5. CHECKPOINT TIMELINE & COACH THREAD (Border-free) ───────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Checkpoint Timeline (1 col) */}
              <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-4">
                <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  Milestone Checkpoint
                </h3>

                <div className="space-y-3">
                  {([1, 2, 3] as (1 | 2 | 3)[]).map(m => {
                    const rev = reviews[m];
                    const isCurrent = selectedMonth === m;
                    return (
                      <button
                        key={m}
                        onClick={() => handleSelectMonth(m)}
                        className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between ${
                          isCurrent
                            ? "bg-amber-50/80 font-bold"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-extrabold text-navy-900">Checkpoint Bulan Ke-{m}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {m === 1 ? "Evaluasi Hari 1–30" : m === 2 ? "Evaluasi Hari 31–60" : "Evaluasi Hari 61–90"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          rev.status === "ON_TRACK" ? "bg-emerald-100 text-emerald-800"
                          : rev.status === "NEED_SUPPORT" ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-600"
                        }`}>
                          {rev.status === "ON_TRACK" ? "On Track" : rev.status === "NEED_SUPPORT" ? "Need Support" : "Belum Diisi"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coach Conversation Thread (2 cols) */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-navy-900" />
                    Feedback & Catatan Evaluasi (Bulan {selectedMonth})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {coachName}
                  </span>
                </div>

                {/* Conversation Messages */}
                <div className="space-y-3">
                  {/* Participant Message */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-navy-900">
                      <span>Catatan Anda (Peserta)</span>
                      <span className="text-[10px] font-normal text-slate-400">Bulan Ke-{selectedMonth}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      {note || "Belum ada catatan peserta untuk bulan ini."}
                    </p>
                  </div>

                  {/* Coach Reply */}
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <span>Ulasan {coachName}</span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {reviews[selectedMonth]?.coachNote || "Coach sedang meninjau progres perkembangan Anda bulan ini. Tetap jaga konsistensi!"}
                    </p>
                  </div>
                </div>

                {/* Checkpoint Form Editor (PRESERVED UNTOUCHED AS REQUESTED) */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Update Catatan Refleksi Bulan Ke-{selectedMonth}:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus("ON_TRACK")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          status === "ON_TRACK" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        On Track
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus("NEED_SUPPORT")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          status === "NEED_SUPPORT" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Need Support
                      </button>
                    </div>
                  </div>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Tuliskan kendala atau keberhasilan Anda bulan ini..."
                    className="text-xs border-slate-200 focus:border-amber-400 rounded-xl resize-none"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl px-5 h-9">
                      {saving ? "Menyimpan..." : saved ? "✓ Tersimpan!" : "Simpan Catatan Checkpoint"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 6. REFLEKSI AKHIR 90 HARI (Border-free) ────────────────── */}
            <div className="bg-white p-6 rounded-2xl space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  Refleksi Akhir Program (90 Hari)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tuliskan pembelajaran utama, perubahan nyata, dan komitmen keberlanjutan setelah 90 hari.
                </p>
              </div>
              <Textarea
                rows={4}
                value={finalReflection}
                onChange={e => setFinalReflection(e.target.value)}
                placeholder="Tuliskan refleksi & komitmen keberlanjutan Anda..."
                className="text-xs border-slate-200 focus:border-amber-400 rounded-xl resize-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">{finalReflection.length} karakter</span>
                <Button
                  onClick={handleSaveReflection}
                  disabled={savingReflection || !journeyId}
                  className="font-bold text-xs bg-[#071A33] text-amber-300 hover:bg-black rounded-xl px-5 h-9"
                >
                  {savingReflection ? "Menyimpan..." : savedReflection ? "✓ Tersimpan!" : "Simpan Refleksi Akhir"}
                </Button>
              </div>
            </div>

          </div>

          {/* ─── RIGHT SIDEBAR COLUMN (Border-free, Solid Green for Top Area) ─── */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">

            {/* 1. Real Analytical Progress Summary Card */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-extrabold text-navy-900">Ringkasan Evaluasi</h3>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Top Area: Solid Green Background Fill as explicitly requested */}
                {healthData.highestArea ? (
                  <div className="bg-emerald-600 text-white p-3.5 rounded-xl space-y-1 shadow-xs">
                    <p className="font-bold flex items-center gap-1.5 text-white">
                      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                      Area Terbaik: {healthData.highestArea}
                    </p>
                    <p className="text-emerald-50 text-[11px] leading-relaxed">
                      Skor capaian mencapai <strong>{healthData.areas[healthData.highestArea]}%</strong>. Pertahankan ritme istiqamah ini.
                    </p>
                  </div>
                ) : null}

                {healthData.lowestArea && healthData.lowestArea !== healthData.highestArea ? (
                  <div className="bg-amber-50 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      Fokus Perhatian: {healthData.lowestArea}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Skor capaian saat ini berada di <strong>{healthData.areas[healthData.lowestArea]}%</strong>.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Panduan Evaluasi:</span>
                <p className="leading-relaxed">
                  Lakukan pengisian 4 dimensi setiap akhir bulan agar pelaporan komprehensif disajikan secara tepat di Impact Report.
                </p>
              </div>
            </div>

            {/* 2. Real Calculated Success Projection Card */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-3 text-center">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyeksi Kelulusan 90 Hari</span>
                <p className="text-xs text-slate-500">Estimasi berbasis aktivitas real</p>
              </div>
              <div className="relative py-1">
                <span className="text-3xl font-black text-navy-900">
                  {isEarlyStage && projectedOverallPct === 0 ? "--" : `${projectedOverallPct}%`}
                </span>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  {isEarlyStage && projectedOverallPct === 0
                    ? "Sedang Berjalan"
                    : projectedOverallPct >= 80 ? "On Track" : "Perlu Penyesuaian Ritme"}
                </p>
              </div>
            </div>

            {/* 3. Tips & Panduan Monitoring Operasional */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-navy-900">Tips & Panduan Monitoring</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <p className="font-bold text-navy-900 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                    Pelaporan 4 Dimensi
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Pengisian Kualitas (1–5★), Kuantitas, Waktu, dan Biaya dilakukan pada akhir bulan 1, 2, dan 3.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <p className="font-bold text-navy-900 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-navy-900" />
                    Sahabat Safar Akuntabilitas
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Gunakan pengingat di Dashboard untuk memberi motivasi kepada Sahabat Safar Anda.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ─── MODAL DRAWER: INPUT 4 DIMENSI INDIKATOR ─────────────────────── */}
        {editingAreaModal && (
          <Dialog open={!!editingAreaModal} onOpenChange={() => setEditingAreaModal(null)}>
            <DialogContent className="sm:max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
              <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="text-base font-black text-navy-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600" />
                  Pelaporan Indikator: {editingAreaModal}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Input realisasi bulan ke-{selectedMonth}. Skor keberhasilan dihitung otomatis.
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const rep = areaReports[selectedMonth]?.[editingAreaModal];
                if (!rep) return null;
                const overallPct = calcAreaScore(rep);

                return (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Skor Capaian Area:</span>
                      <span className="text-sm font-extrabold text-emerald-600">{overallPct}% Berhasil</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* 1. Kualitas */}
                      <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200 space-y-2">
                        <label className="font-bold text-purple-800 block">1. Kualitas (Mutu / Kekhusyukan)</label>
                        <p className="text-[10px] text-slate-500">Target: {rep.targets.kualitas || "Khusyu & Tepat waktu"}</p>
                        <div className="flex gap-1 py-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => updateAreaReport(editingAreaModal, "kualitasRating", star)}
                              className="transition-transform hover:scale-125"
                            >
                              <Star className={`h-5 w-5 ${star <= rep.kualitasRating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-slate-600 ml-1 self-center">{rep.kualitasRating}/5 ★</span>
                        </div>
                      </div>

                      {/* 2. Kuantitas */}
                      <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 space-y-2">
                        <label className="font-bold text-blue-800 block">2. Kuantitas (Realisasi)</label>
                        <p className="text-[10px] text-slate-500">Target: {rep.targets.kuantitas || "Target PTP"}</p>
                        <div className="space-y-1.5">
                          <Input
                            value={rep.kuantitasActual}
                            onChange={e => updateAreaReport(editingAreaModal, "kuantitasActual", e.target.value)}
                            placeholder="Realisasi bulan ini (misal: 95)"
                            className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      {/* 3. Waktu */}
                      <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-2">
                        <label className="font-bold text-amber-800 block">3. Waktu (Hari Tepat Waktu)</label>
                        <p className="text-[10px] text-slate-500">Target: {rep.targets.waktu || "Jadwal Tepat Waktu"}</p>
                        <Input
                          type="number" min={0} max={30}
                          value={rep.waktuActualDays}
                          onChange={e => updateAreaReport(editingAreaModal, "waktuActualDays", e.target.value)}
                          placeholder="Hari tepat waktu dari 30 (misal: 25)"
                          className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                        />
                      </div>

                      {/* 4. Biaya */}
                      <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                        <label className="font-bold text-emerald-800 block">4. Biaya / Sedekah (Nominal)</label>
                        <p className="text-[10px] text-slate-500">Target: {rep.targets.biaya || "Sedekah Rp"}</p>
                        <Input
                          value={rep.biayaActual}
                          onChange={e => updateAreaReport(editingAreaModal, "biayaActual", e.target.value)}
                          placeholder="Nominal realisasi (misal: 600000)"
                          className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3">
                      <Button variant="outline" onClick={() => setEditingAreaModal(null)} className="text-xs font-semibold rounded-xl h-9">
                        Batal
                      </Button>
                      <Button
                        onClick={() => handleSaveIndReport(editingAreaModal)}
                        disabled={savingArea === editingAreaModal}
                        className="bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-9 px-5"
                      >
                        {savingArea === editingAreaModal ? "Menyimpan..." : "Simpan Capaian Bulanan"}
                      </Button>
                    </DialogFooter>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}

      </main>
    </ParticipantLayout>
  );
}
