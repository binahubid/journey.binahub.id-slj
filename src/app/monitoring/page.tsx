"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  TrendingUp,
  Star,
  Target,
  Calendar,
  MessageSquare,
  Flame,
  Edit3,
  BookOpen,
  Lock,
  Hourglass,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSljAccess, getTrialProgress, TRIAL_DAYS, TRIAL_PROGRAM_CODE } from "@/lib/program-access";
import { getTransformationAreaColor, normalizeTransformationArea } from "@/lib/transformation-areas";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { ParticipantPageSkeleton } from "@/components/layout/ParticipantPageSkeleton";
import { cn } from "@/lib/utils";
import { getActiveProgramMonth, getMonthEditState, getProgramDay, getProgramMonthWindow } from "@/lib/program-timeline";
import Link from "next/link";
import { calculateExecution } from "@/lib/execution";
import { calculateAreaOutcome, calculateIndicatorCoverage, calculateIndicatorOutcomes, getQualityRubricDescription, indicatorActualSources, type IndicatorDefinition, type IndicatorActualSource } from "@/lib/assessment-methodology";
import { addCalendarDays, getLocalDateString, resolveParticipantTimeZone } from "@/lib/local-date";

type HabitFrequency = "daily" | "weekly" | "unsupported";
type ChartPoint = {
  date: string;
  programDay: number;
  scores: Record<string, number | null>;
};

function normalizeHabitFrequency(value?: string | null): HabitFrequency {
  const frequency = String(value || "").trim().toLowerCase();
  if (["daily", "harian", "setiap hari"].includes(frequency)) return "daily";
  if (["weekly", "pekanan"].includes(frequency) || frequency.includes("minggu")) return "weekly";
  return "unsupported";
}

function getMondayWeekStart(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  return addCalendarDays(dateString, -((dayOfWeek + 6) % 7));
}

function getCompletedUnits(log?: { completed: boolean; completed_count?: number | null }): number {
  return log?.completed_count ?? (log?.completed ? 1 : 0);
}

function parseOptionalNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeHabitQuantity(...values: unknown[]): number {
  const quantity = values.map(Number).find(value => Number.isFinite(value) && value > 0);
  return quantity ? Math.max(1, quantity) : 1;
}

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
  kualitasRating: number | null;
  kuantitasBaseline: string;
  kuantitasActual: string;
  waktuActualDays: string;
  biayaActual: string;
  isSaved?: boolean;
  baselineScore?: number;
  indicators?: IndicatorDefinition[];
  indicatorActuals?: Record<string, number | undefined>;
  indicatorEvidenceNotes?: Record<string, string | undefined>;
}

// ── Formula Calculation Functions ──────────────────────────────────────────

// ── Month Edit Window Helper ────────────────────────────────────────────────
// Bulan ke-N aktif diisi mulai hari ke-((N-1)*30+1), tetap bisa diedit sampai
// 7 hari masuk ke bulan berikutnya (masa tenggang), lalu terkunci permanen.
function calcAreaScore(rep: AreaReport): number | null {
  if (!rep.indicators?.length) return null;
  return calculateAreaOutcome(calculateIndicatorOutcomes(rep.indicators, rep.indicatorActuals || {})).score;
}

function getMeasurementCoverage(rep?: AreaReport) {
  const active = rep?.indicators?.filter((indicator) => indicator.active) || [];
  if (!active.length) return 0;
  const measured = active.filter((indicator) => {
    const actual = rep?.indicatorActuals?.[indicator.key];
    return Number.isFinite(actual) && (actual as number) >= 0;
  }).length;
  return Math.round(measured / active.length * 100);
}

export default function MonitoringPage() {
  const supabase = createClient();

  const [dayCount, setDayCount] = useState(1);
  const [isTrial, setIsTrial] = useState(false);
  const totalDays = isTrial ? TRIAL_DAYS : 90;
  const firstReflectionDay = totalDays - 1;
  const periodDays = isTrial ? 7 : 30;
  const periodLabel = isTrial ? "Pekan" : "Bulan";
  const editState = (period: 1 | 2 | 3) => getMonthEditState(period, dayCount, periodDays, isTrial ? 0 : 7);
  const [coachName, setCoachName] = useState("Coach Pendamping");
  const [selectedMonth, setSelectedMonth] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"ON_TRACK" | "NEED_SUPPORT">("ON_TRACK");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [progressView, setProgressView] = useState<"overview" | "targets" | "evaluation">("overview");

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
  const [saveError, setSaveError] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState<"7d" | "1m" | "3m">("7d");
  const [chartArea, setChartArea] = useState<string>("all");
  const [timeline, setTimeline] = useState<ChartPoint[]>([]);
  const [areaActionPlanCounts, setAreaActionPlanCounts] = useState<Record<string, number>>({});
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number; level: number }[]>([]);
  const [habitConsistencyPct, setHabitConsistencyPct] = useState<number | null>(null);
  const [indicatorCoverage, setIndicatorCoverage] = useState<Record<string, number>>({});

  // Modal Drawer for 4-Dimension Indicator Update
  const [editingAreaModal, setEditingAreaModal] = useState<string | null>(null);

  // Ref data for auto-actual suggestion from linked action plans
  const programStartDateRef = useRef<string>("");
  const trialCalendarRef = useRef<{ start: number; timeZone: string } | null>(null);
  const habitIdByActionPlanRef = useRef<Record<string, string>>({});
  const habitLogsByHabitRef = useRef<Record<string, Array<{ activity_date?: string | null; date: string; completed: boolean; completed_count?: number | null }>>>({});

  // ── Load Data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase.from("profiles").select("start_date, end_date, program_code, timezone, timezone_mode").eq("user_id", user.id).maybeSingle();
      if (profileError) throw profileError;
      const trial = profile?.program_code === TRIAL_PROGRAM_CODE;
      setIsTrial(trial);
      const trialAccess = trial ? await getSljAccess(supabase) : null;

      // Monthly reviews
      const { data: revData, error: reviewError } = await supabase.from("monthly_reviews").select("*").eq("user_id", user.id);
      if (reviewError) throw reviewError;
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

      // Journey (areas + targets)
      const { data: journey, error: journeyError } = await supabase.from("journeys")
        .select("id, created_at, area_transformasi, main_target, final_reflection")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();

      if (journeyError) throw journeyError;
      if (!journey) return;

      const today = new Date();
      const participantTimeZone = resolveParticipantTimeZone(profile?.timezone, profile?.timezone_mode === "MANUAL" ? "MANUAL" : "AUTO");
      const todayStr = getLocalDateString(today, participantTimeZone);
      const start = trialAccess?.starts_at || profile?.start_date || journey.created_at;
      const profileStartDate = start ? getLocalDateString(new Date(start), participantTimeZone) : todayStr;
      const programDay = trialAccess ? getTrialProgress(trialAccess).day : getProgramDay(profileStartDate, today, participantTimeZone);
      trialCalendarRef.current = trialAccess && start
        ? { start: Date.parse(start), timeZone: participantTimeZone }
        : null;
      programStartDateRef.current = profileStartDate;
      setDayCount(programDay);
      const initialMonth = getActiveProgramMonth(programDay, trial ? 7 : 30, trial ? 2 : 3) ?? 1;
      setSelectedMonth(initialMonth);
      setStatus(revMap[initialMonth]?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
      setNote(revMap[initialMonth]?.participantNote || "");

      setJourneyId(journey.id);
      setFinalReflection(journey.final_reflection || "");

      const areas: string[] = Array.isArray(journey.area_transformasi)
        ? journey.area_transformasi.map(normalizeTransformationArea)
        : [];
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

      const { data: indicatorRows, error: indicatorsError } = await supabase.from("ptp_indicators")
        .select("id, area, indicator_key, indicator_type, label, active, direction, baseline_value, target_value, unit, actual_source, quality_rubric")
        .eq("journey_id", journey.id).order("created_at", { ascending: true });
      const structuredAvailable = !indicatorsError;
      if (indicatorsError && indicatorsError.code !== "42P01" && indicatorsError.code !== "PGRST205") throw indicatorsError;

      let linkMap: Record<string, string[]> = {};
      if (indicatorRows?.length) {
        const { data: links, error: linksError } = await supabase.from("ptp_indicator_action_plans").select("indicator_id, action_plan_id");
        if (linksError && linksError.code !== "42P01" && linksError.code !== "PGRST205") throw linksError;
        if (links?.length) {
          const idToKey = new Map(indicatorRows.map((item: any) => [item.id, `${item.area}:${item.indicator_key}`]));
          links.forEach((link: any) => {
            const key = idToKey.get(link.indicator_id);
            if (!key) return;
            linkMap[key] = [...(linkMap[key] || []), link.action_plan_id];
          });
        }
      }

      const { data: actualRows, error: actualsError } = structuredAvailable
        ? await supabase.from("ptp_indicator_actuals").select("indicator_id, month_number, actual_value, evidence_note").eq("journey_id", journey.id)
        : { data: [], error: null };
      if (actualsError && actualsError.code !== "42P01" && actualsError.code !== "PGRST205") throw actualsError;

      // Fetch Baseline Assessment Answers if available
      const { data: baselineAssessment } = await supabase.from("baseline_assessments")
        .select("id").eq("user_id", user.id).eq("completed", true).maybeSingle();
      const { data: bAnswers } = baselineAssessment
        ? await supabase.from("baseline_answers")
            .select("area, score")
            .eq("assessment_id", baselineAssessment.id)
        : { data: [] };
      
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
          const definitions = (indicatorRows || []).filter((row: any) => row.area === area).slice(0, 4).map((row: any) => ({
            key: row.indicator_key, type: row.indicator_type || "quantity", label: row.label, active: row.active, direction: row.direction,
            baseline: Number(row.baseline_value), target: Number(row.target_value), unit: row.unit || "",
            actualSource: row.actual_source || "self_report", qualityRubric: row.quality_rubric || undefined,
            linkedActionPlanIds: linkMap[`${area}:${row.indicator_key}`] || [],
          } as IndicatorDefinition));
          const monthActualRows = (actualRows || []).filter((row: any) => row.month_number === month);
          const actuals = Object.fromEntries(monthActualRows.flatMap((row: any) => {
            const definition = (indicatorRows || []).find((item: any) => item.id === row.indicator_id);
            const actual = Number(row.actual_value);
            return definition && Number.isFinite(actual) && actual >= 0 ? [[definition.indicator_key, actual]] : [];
          }));
          const evidenceNotes = Object.fromEntries(monthActualRows.flatMap((row: any) => {
            const definition = (indicatorRows || []).find((item: any) => item.id === row.indicator_id);
            return definition && row.evidence_note ? [[definition.indicator_key, row.evidence_note]] : [];
          }));
          if (month === initialMonth) setIndicatorCoverage(current => ({ ...current, [area]: calculateIndicatorCoverage(definitions.filter(indicator => indicator.active).length).score || 0 }));
          newReports[month][area] = saved
            ? {
                area,
                targets: targetsMap[area] || { mainTarget: "", kualitas: "", kuantitas: "", waktu: "", biaya: "" },
                kualitasRating: saved.kualitas_actual_rating ?? null,
                kuantitasBaseline: saved.kuantitas_baseline?.toString() || ptpBaseline,
                kuantitasActual: saved.kuantitas_actual?.toString() || "",
                waktuActualDays: saved.waktu_actual_days?.toString() || "",
                biayaActual: saved.biaya_actual?.toString() || "",
                isSaved: true,
                baselineScore: bScore,
                indicators: definitions,
                indicatorActuals: actuals,
                indicatorEvidenceNotes: evidenceNotes,
              }
            : { ...buildEmptyReport(area, targetsMap[area] || { mainTarget: "", kualitas: "", kuantitas: "", waktu: "", biaya: "" }, bScore), indicators: definitions, indicatorActuals: actuals, indicatorEvidenceNotes: evidenceNotes };

          if (!saved && ptpBaseline) {
            newReports[month][area].kuantitasBaseline = ptpBaseline;
          }
        });
      });
      setAreaReports(newReports);

      const { data: actionPlans, error: actionPlansError } = await supabase.from("action_plans")
        .select("*").eq("journey_id", journey.id).eq("user_id", user.id);
      if (actionPlansError) throw actionPlansError;

      const { data: habitsList, error: habitsError } = await supabase.from("habits")
        .select("*").eq("user_id", user.id);
      if (habitsError) throw habitsError;

      const apAreaMap: Record<string, string> = {};
      (actionPlans || []).forEach((ap: any) => {
        const area = normalizeTransformationArea(ap.area_category || "Tanpa Area");
        apAreaMap[ap.id] = area;
      });

      const planCounts: Record<string, number> = {};
      areas.forEach(area => { planCounts[area] = 0; });
      (actionPlans || []).forEach((ap: any) => {
        const area = apAreaMap[ap.id];
        if (areas.includes(area)) planCounts[area] += 1;
      });
      setAreaActionPlanCounts(planCounts);

      const activeHabits = (habitsList || []).filter(h => !h.is_archived && (!h.action_plan_id || Object.hasOwn(apAreaMap, h.action_plan_id)));
      habitIdByActionPlanRef.current = {};
      const executionHabits = activeHabits.map(habit => {
        const planId = habit.action_plan_id;
        if (planId) habitIdByActionPlanRef.current[planId] = habit.id;
        const schedule = habit.custom_schedule as { weekdays?: number[] } | null;
        return {
          id: habit.id,
          area: planId ? apAreaMap[planId] : normalizeTransformationArea(habit.area_category || habit.category || "Tanpa Area"),
          quantity: normalizeHabitQuantity(habit.quantity, habit.target),
          frequency: habit.frequency_kind || normalizeHabitFrequency(habit.frequency),
          weekdays: schedule?.weekdays,
          effectiveFrom: habit.effective_from,
          effectiveUntil: habit.effective_until,
        };
      });
      for (const plan of actionPlans || []) {
        if ((habitsList || []).some(habit => habit.action_plan_id === plan.id)) continue;
        executionHabits.push({
          id: "missing:" + plan.id,
          area: apAreaMap[plan.id],
          quantity: normalizeHabitQuantity(plan.quantity, plan.target),
          frequency: normalizeHabitFrequency(plan.frequency),
          weekdays: undefined,
          effectiveFrom: null,
          effectiveUntil: null,
        });
      }

      const programEndDate = trialAccess?.expires_at
        ? getLocalDateString(new Date(Date.parse(trialAccess.expires_at) - 1), participantTimeZone)
        : addCalendarDays(profileStartDate, 89);
      const lastDate = todayStr < programEndDate ? todayStr : programEndDate;
      const { data, error: habitLogsError } = await supabase.from("habit_logs")
        .select("habit_id, date, activity_date, completed, completed_count")
        .eq("user_id", user.id)
        .eq("is_canonical_occurrence", true)
        .gte("date", getMondayWeekStart(profileStartDate))
        .lte("date", lastDate);
      if (habitLogsError) throw habitLogsError;
      const habitLogs = data || [];

      habitLogsByHabitRef.current = {};
      for (const log of habitLogs) {
        (habitLogsByHabitRef.current[log.habit_id] ||= []).push(log);
      }

      const execution = calculateExecution({ startDate: profileStartDate, endDate: lastDate, areas, habits: executionHabits, logs: habitLogs });
      setHabitConsistencyPct(execution.score === null ? null : Math.round(execution.score));
      setTimeline(execution.timeline.map((point, index) => ({ date: point.date, scores: point.scores, programDay: index + 1 })));

      const heatmapDays = trial ? TRIAL_DAYS : 90;
      const dates90 = Array.from({ length: heatmapDays }, (_, index) => addCalendarDays(lastDate, index - heatmapDays + 1));
      const heatmap = dates90.map(dateStr => {
        const scheduledHabits = executionHabits.filter(h =>
          dateStr >= profileStartDate && dateStr <= programEndDate &&
          (!h.effectiveFrom || h.effectiveFrom <= dateStr) &&
          (!h.effectiveUntil || h.effectiveUntil >= dateStr)
        );
        const completedCount = scheduledHabits.reduce((sum, habit) => {
          const log = habitLogsByHabitRef.current[habit.id]?.find(item => (item.activity_date || item.date) === dateStr);
          return sum + Math.min(habit.quantity, getCompletedUnits(log));
        }, 0);
        const level = completedCount > 10 ? 4 : completedCount >= 7 ? 3 : completedCount >= 4 ? 2 : completedCount > 0 ? 1 : 0;
        return { date: dateStr, count: completedCount, level };
      });
      setHeatmapData(heatmap);

    } catch (err) {
      const error = err as { code?: string; message?: string; details?: string; hint?: string };
      console.error("Gagal memuat monitoring:", {
        code: error?.code,
        message: error?.message || String(err),
        details: error?.details,
        hint: error?.hint,
      });
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const buildEmptyReport = (area: string, targets: AreaIndicatorTargets, baselineScore?: number): AreaReport => ({
    area, targets, kualitasRating: null,
    kuantitasBaseline: "", kuantitasActual: "", waktuActualDays: "", biayaActual: "",
    isSaved: false, baselineScore,
  });

  // Trial measurements accumulate toward the same 14-day target across both evaluations.
  const computeSuggestedActual = (indicator: IndicatorDefinition): number | null => {
    if (indicator.actualSource !== "action_plan" || !indicator.linkedActionPlanIds?.length) return null;
    const start = programStartDateRef.current;
    if (!start) return null;
    const trialCalendar = trialCalendarRef.current;
    const monthStart = trialCalendar ? start : addCalendarDays(start, (selectedMonth - 1) * periodDays);
    const monthEnd = trialCalendar
      ? getLocalDateString(new Date(trialCalendar.start + selectedMonth * periodDays * 86_400_000 - 1), trialCalendar.timeZone)
      : addCalendarDays(start, selectedMonth * periodDays - 1);
    let total = 0;
    indicator.linkedActionPlanIds.forEach(planId => {
      const habitId = habitIdByActionPlanRef.current[planId];
      if (!habitId) return;
      (habitLogsByHabitRef.current[habitId] || []).forEach(log => {
        const date = log.activity_date || log.date;
        if (date >= monthStart && date <= monthEnd) {
          total += getCompletedUnits(log);
        }
      });
    });
    return total;
  };

  const sourceLabel = (source?: IndicatorActualSource) =>
    indicatorActualSources.find(item => item.key === (source || "self_report"))?.label || "Laporan Mandiri";

  const handleSelectMonth = (month: 1 | 2 | 3) => {
    setEditingAreaModal(null);
    setSaveError(null);
    setSelectedMonth(month);
    const rev = reviews[month];
    setStatus(rev?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
    setNote(rev?.participantNote || "");
  };

  const handleSave = async () => {
    if (editState(selectedMonth) !== "ACTIVE") {
      setSaveError(
        editState(selectedMonth) === "LOCKED_FUTURE"
          ? `Checkpoint ${periodLabel} Ke-${selectedMonth} belum aktif.`
          : `Checkpoint ${periodLabel} Ke-${selectedMonth} sudah terkunci dan tidak dapat diedit.`
      );
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentReview = reviews[selectedMonth];
      const { data, error } = await supabase.from("monthly_reviews").upsert({
        id: currentReview?.id,
        user_id: user.id, month_number: selectedMonth, status, participant_note: note,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,month_number" }).select().maybeSingle();
      if (error) throw error;
      if (data) {
        setReviews(prev => ({
          ...prev,
          [selectedMonth]: { ...prev[selectedMonth], id: data.id, status, participantNote: note },
        }));
        setSaved(true); setTimeout(() => setSaved(false), 2500);
      }
    } catch (err: any) { console.error(err); setSaveError(`Gagal menyimpan checkpoint: ${err.message || "silakan coba lagi"}.`); } finally { setSaving(false); }
  };

  const handleSaveIndReport = async (area: string) => {
    if (editState(selectedMonth) !== "ACTIVE") return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !journeyId) return;
    const rep = areaReports[selectedMonth]?.[area];
    if (!rep) return;
    setSaveError(null);
    const invalidActual = (rep.indicators || []).some((indicator) => indicator.active && rep.indicatorActuals?.[indicator.key] !== undefined && (!Number.isFinite(rep.indicatorActuals[indicator.key]) || (rep.indicatorActuals[indicator.key] as number) < 0));
    if (invalidActual) {
      setSaveError(`${area}: actual indikator harus berupa angka valid dan tidak boleh negatif.`);
      return;
    }
    const usesLegacyRating = !rep.indicators?.length && (!rep.targets.kualitas && !rep.targets.kuantitas && !rep.targets.waktu && !rep.targets.biaya || Boolean(rep.targets.kualitas));
    if (usesLegacyRating && rep.kualitasRating === null) {
      setSaveError(`${area}: rating evaluasi mandiri belum diisi.`);
      return;
    }
    setSavingArea(area);
    try {
      const { error } = await supabase.from("monthly_indicator_reports").upsert({
        user_id: user.id,
        journey_id: journeyId,
        month_number: selectedMonth,
        area,
        kualitas_actual_rating: rep.kualitasRating,
        kuantitas_baseline: parseOptionalNumber(rep.kuantitasBaseline),
        kuantitas_actual: parseOptionalNumber(rep.kuantitasActual),
        waktu_actual_days: parseOptionalNumber(rep.waktuActualDays),
        biaya_actual: parseOptionalNumber(rep.biayaActual.replace(/[^0-9.]/g, "")),
        score_percentage: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,month_number,area" });
      if (error) throw error;
      if (rep.indicators?.length) {
        for (const indicator of rep.indicators.filter(item => item.active)) {
          const actual = rep.indicatorActuals?.[indicator.key];
          if (!Number.isFinite(actual)) continue;
          const { data: definition, error: definitionError } = await supabase.from("ptp_indicators")
            .select("id").eq("journey_id", journeyId).eq("area", area).eq("indicator_key", indicator.key).maybeSingle();
          if (definitionError && definitionError.code !== "42P01" && definitionError.code !== "PGRST205") throw definitionError;
           if (definition?.id) {
             const { error: actualError } = await supabase.from("ptp_indicator_actuals").upsert({
               indicator_id: definition.id, participant_user_id: user.id, journey_id: journeyId,
               month_number: selectedMonth, actual_value: actual, evidence_note: rep.indicatorEvidenceNotes?.[indicator.key] || null, updated_at: new Date().toISOString(),
            }, { onConflict: "indicator_id,month_number" });
            if (actualError && actualError.code !== "42P01" && actualError.code !== "PGRST205") throw actualError;
          }
        }
      }
      setAreaReports(prev => ({
        ...prev,
        [selectedMonth]: {
          ...prev[selectedMonth],
          [area]: { ...prev[selectedMonth][area], isSaved: true },
        },
      }));
      setEditingAreaModal(null);
    } catch (err: any) {
      console.error(err);
      setSaveError(`Gagal menyimpan capaian ${area}: ${err.message || "silakan coba lagi"}.`);
    } finally {
      setSavingArea(null);
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
    if (!journeyId || dayCount < firstReflectionDay) {
      setSaveError("Refleksi akhir tersedia mulai hari ke-" + firstReflectionDay + ".");
      return;
    }
    setSavingReflection(true);
    try {
      setSaveError(null);
      const { error } = await supabase.from("journeys").update({
        final_reflection: finalReflection, updated_at: new Date().toISOString(),
      }).eq("id", journeyId);
      if (error) throw error;
      setSavedReflection(true); setTimeout(() => setSavedReflection(false), 2500);
    } catch (err: any) { console.error(err); setSaveError(`Gagal menyimpan refleksi: ${err.message || "silakan coba lagi"}.`); } finally { setSavingReflection(false); }
  };

  // Overall Health Score Calculation & Guilt-Free Status Helper
  const calculateHealthScores = () => {
    if (selectedAreas.length === 0) return { overall: null as number | null, areas: {} as Record<string, number | null>, highestArea: "", lowestArea: "" };
    const measuredScores: number[] = [];
    const areaScores: Record<string, number | null> = {};
    let highest = { area: selectedAreas[0] || "", score: -1 };
    let lowest = { area: selectedAreas[0] || "", score: 999 };

    selectedAreas.forEach(area => {
      const rep = areaReports[selectedMonth]?.[area];
      const score = rep ? calcAreaScore(rep) : null;
      areaScores[area] = score;
      if (score !== null) {
        measuredScores.push(score);
        if (score > highest.score) highest = { area, score };
        if (score < lowest.score) lowest = { area, score };
      }
    });
    const overall = measuredScores.length ? Math.round(measuredScores.reduce((sum, score) => sum + score, 0) / measuredScores.length) : null;
    return { overall, areas: areaScores, highestArea: measuredScores.length ? highest.area : "", lowestArea: measuredScores.length ? lowest.area : "" };
  };

  const healthData = calculateHealthScores();
  const daysRemaining = Math.max(0, totalDays - dayCount + (isTrial ? 1 : 0));

  // Status kunci/aktif untuk input capaian bulan yang sedang dipilih
  const monthEditState = editState(selectedMonth);
  const { startDay: monthStartDay, graceEndDay: monthGraceEndDay } = getProgramMonthWindow(selectedMonth, periodDays, isTrial ? 0 : 7);
  const finalReflectionUnlocked = dayCount >= firstReflectionDay;

  const visibleChartAreas = chartArea === "all" || !selectedAreas.includes(chartArea) ? selectedAreas : [chartArea];
  const chartY = (value: number) => 160 - value * 1.44;
  const chartAxisValues = [100, 75, 50, 25, 0];
  const displayedDays = timeframe === "7d" ? 7 : isTrial ? TRIAL_DAYS : timeframe === "1m" ? 30 : 90;
  const chartDayFormat = new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    ...(timeframe === "7d" ? { weekday: "short" } : { day: "numeric", month: "numeric" }),
  });
  const chartData = timeline.slice(-displayedDays).map(point => ({
    ...point,
    day: chartDayFormat.format(new Date(point.date + "T12:00:00Z")),
  }));
  const hasChartData = chartData.some(point => visibleChartAreas.some(area => point.scores[area] != null));
  const labelCount = Math.min(chartData.length, timeframe === "7d" ? 7 : 5);
  const visibleChartLabels = Array.from({ length: labelCount }, (_, index) =>
    labelCount === 1 ? 0 : Math.round(index * (chartData.length - 1) / (labelCount - 1))
  );
  const chartX = (index: number) => chartData.length === 1 ? 50 : index / (chartData.length - 1) * 100;
  const activeIstiqamahDays = heatmapData.filter(item => item.count > 0).length;
  const totalIstiqamahExecutions = heatmapData.reduce((total, item) => total + item.count, 0);

  if (loading) return <ParticipantPageSkeleton kind="monitoring" />;

  if (loadError) {
    return (
      <ParticipantLayout activePath="/monitoring" pageTitle="Progres dan evaluasi">
        <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold">Progres belum dapat dibuka</h1>
          <p role="alert" className="text-sm leading-6 text-slate-600">Periksa koneksi Anda, lalu coba muat ulang progres.</p>
          <Button onClick={() => void loadData()}>Muat ulang</Button>
        </section>
      </ParticipantLayout>
    );
  }

  if (!journeyId) {
    return (
      <ParticipantLayout activePath="/monitoring" pageTitle="Monitoring Perjalanan SLJ">
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <Target className="h-10 w-10 text-amber-700 mx-auto" />
          <h1 className="text-xl font-semibold text-navy-900">Lengkapi rencana perubahan</h1>
          <p className="text-sm text-slate-600">
            {isTrial ? "Tetapkan target dan kebiasaan Spiritual Growth agar progres Anda dapat dihitung." : "Tetapkan target dan kebiasaan di tiga area transformasi agar progres Anda dapat dihitung."}
          </p>
          <Link href="/journey">
            <Button className="bg-navy-900 text-amber-300">Lengkapi PTP</Button>
          </Link>
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout activePath="/monitoring" pageTitle="Progres dan evaluasi">
      <div className="mx-auto max-w-6xl space-y-6 pb-6">
        {saveError && !editingAreaModal && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
          >
            {saveError}
          </div>
        )}
        <header className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Hari ke-{Math.min(totalDays, dayCount)} dari {totalDays}
            </span>
            <span className="tabular-nums">{daysRemaining} hari tersisa</span>
          </div>
          <div>
            <h1 className="text-balance text-2xl font-semibold text-navy-900 sm:text-3xl">
              Progres dan evaluasi
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
              {isTrial
                ? "Lihat perkembangan latihan Spiritual Growth Anda selama 14 hari."
                : "Lihat kebiasaan yang Anda jalankan dan kemajuan menuju target perubahan Anda."}
            </p>
          </div>
          <div
            role="group"
            aria-label="Periode evaluasi"
            className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"
          >
            {((isTrial ? [1, 2] : [1, 2, 3]) as (1 | 2 | 3)[]).map((period) => (
              <Button
                key={period}
                type="button"
                variant="ghost"
                aria-pressed={selectedMonth === period}
                onClick={() => handleSelectMonth(period)}
                className={cn(
                  "min-h-11 rounded-xl px-4 text-sm",
                  selectedMonth === period
                    ? "bg-navy-900 text-white hover:bg-navy-900 hover:text-white"
                    : "bg-slate-50 text-slate-600",
                )}
              >
                {periodLabel} {period}
              </Button>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-500">
            {monthEditState === "ACTIVE"
              ? "Anda dapat mengisi dan memperbarui evaluasi periode ini sampai hari ke-" +
                monthGraceEndDay +
                "."
              : monthEditState === "LOCKED_FUTURE"
                ? "Pengisian periode ini dibuka pada hari ke-" + monthStartDay + "."
                : "Periode ini sudah selesai dan dapat Anda baca kembali."}
          </p>
        </header>
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-medium text-navy-900">Capaian target</h2>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-navy-900">
              {healthData.overall === null ? "—" : healthData.overall + "%"}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {healthData.overall === null
                ? "Isi nilai aktual pada tab Capaian untuk melihat hasil."
                : "Kemajuan menuju target pada " +
                  periodLabel.toLowerCase() +
                  " " +
                  selectedMonth +
                  "."}
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-medium text-navy-900">Pelaksanaan habit</h2>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-navy-900">
              {habitConsistencyPct === null ? "—" : habitConsistencyPct + "%"}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {habitConsistencyPct === null
                ? "Belum ada jadwal habit yang dapat dihitung."
                : "Kebiasaan yang terlaksana sesuai jadwal sejak awal program."}
            </p>
          </section>
        </div>
        <div
          role="group"
          aria-label="Tampilan progres"
          className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1"
        >
          {(
            [
              { id: "overview", label: "Ringkasan" },
              { id: "targets", label: "Capaian" },
              { id: "evaluation", label: "Evaluasi" },
            ] as const
          ).map((item) => (
            <Button
              type="button"
              key={item.id}
              variant="ghost"
              aria-pressed={progressView === item.id}
              aria-controls={"progress-" + item.id}
              onClick={() => setProgressView(item.id)}
              className={cn(
                "min-h-11 rounded-xl px-2 text-xs sm:text-sm",
                progressView === item.id ? "bg-white text-navy-900 shadow-sm" : "text-slate-600",
              )}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <section
          id="progress-overview"
          aria-label="Ringkasan progres"
          className={cn("space-y-6", progressView !== "overview" && "hidden")}
        >
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            {/* Dynamic Multi-Timeframe Chart (2 cols) */}
            <section className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
              <div className="space-y-4 border-b border-slate-100 px-5 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </span>
                      Konsistensi pelaksanaan
                    </h3>
                    <p className="ml-10 mt-0.5 text-xs leading-relaxed text-slate-600">
                      Persentase habit yang terlaksana sesuai jadwal, dihitung sejak awal program.
                    </p>
                  </div>
                  {/* Timeframe Filter Toggle */}
                  <div className="flex shrink-0 items-center gap-0.5 self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:self-auto">
                    {((isTrial ? ["7d", "1m"] : ["7d", "1m", "3m"]) as ("7d" | "1m" | "3m")[]).map(
                      (tf) => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setTimeframe(tf)}
                          aria-pressed={timeframe === tf}
                          className={`min-h-11 rounded-md px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
                            timeframe === tf
                              ? "bg-white text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                              : "text-slate-600 hover:text-slate-700"
                          }`}
                        >
                          {tf === "7d"
                            ? "7 Hari"
                            : tf === "1m"
                              ? isTrial
                                ? "14 Hari"
                                : "1 Bulan"
                              : "3 Bulan"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div
                  role="group"
                  className="flex flex-wrap gap-1.5"
                  aria-label="Filter area transformasi"
                >
                  <button
                    type="button"
                    aria-pressed={chartArea === "all"}
                    onClick={() => setChartArea("all")}
                    className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${chartArea === "all" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Semua area
                  </button>
                  {selectedAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      aria-pressed={chartArea === area}
                      onClick={() => setChartArea(area)}
                      className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${chartArea === area ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      style={chartArea === area ? { backgroundColor: "#0F1E3D" } : undefined}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              {/* Line Chart Render */}
              {selectedAreas.length === 0 ? (
                <div className="space-y-2 px-5 py-16 text-center">
                  <p className="text-xs text-slate-600">Belum ada area dipilih di PTP.</p>
                  <Link href="/journey">
                    <Button variant="outline" className="text-xs font-bold rounded-xl border-amber-400">
                      Lengkapi PTP
                    </Button>
                  </Link>
                </div>
              ) : !hasChartData ? (
                <div className="px-5 py-16 text-center text-sm text-slate-600">
                  Belum ada jadwal kebiasaan yang dapat dihitung pada rentang ini.
                </div>
              ) : (
                <div className="px-5 pb-4 pt-3 sm:px-6">
                  <div className="relative ml-10 mr-3 h-44 sm:h-52">
                    <svg
                      className="absolute inset-0 h-full w-full overflow-visible"
                      viewBox="0 0 720 180"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Grafik persentase pelaksanaan habit per area"
                    >
                      {chartAxisValues.map((value) => (
                        <line
                          key={value}
                          x1="0"
                          y1={chartY(value)}
                          x2="720"
                          y2={chartY(value)}
                          stroke={value === 0 ? "#CBD5E1" : "#E2E8F0"}
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      {visibleChartAreas.map((area) => {
                        const points = chartData.map((row, index) => {
                          const score = row.scores[area];
                          return score == null
                            ? null
                            : { x: chartX(index) * 7.2, y: chartY(score), score, index };
                        });
                        const path = points.reduce(
                          (result, point, index) =>
                            point
                              ? result +
                                (!points[index - 1] ? "M" : "L") +
                                point.x +
                                " " +
                                point.y +
                                " "
                              : result,
                          "",
                        );
                        const color = getTransformationAreaColor(area);
                        return (
                          <g key={area}>
                            <path
                              d={path}
                              fill="none"
                              stroke={color}
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                            {points.map(
                              (point) =>
                                point && (
                                  <circle
                                    key={point.index}
                                    cx={point.x}
                                    cy={point.y}
                                    r={2.5}
                                    fill="white"
                                    stroke={color}
                                    strokeWidth={1.5}
                                    vectorEffect="non-scaling-stroke"
                                  >
                                    <title>
                                      {area} · Hari {chartData[point.index].programDay} ·{" "}
                                      {Math.round(point.score)}%
                                    </title>
                                  </circle>
                                ),
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    {chartAxisValues.map((value) => (
                      <span
                        key={value}
                        aria-hidden="true"
                        className="absolute right-full mr-2 -translate-y-1/2 whitespace-nowrap text-xs tabular-nums text-slate-500"
                        style={{ top: (chartY(value) / 180) * 100 + "%" }}
                      >
                        {value}%
                      </span>
                    ))}
                  </div>
                  <div className="relative ml-10 mr-3 h-5 text-xs tabular-nums text-slate-600">
                    {visibleChartLabels.map((index) => (
                      <span
                        key={index}
                        className="absolute -translate-x-1/2 whitespace-nowrap"
                        style={{ left: chartX(index) + "%" }}
                      >
                        {chartData[index].day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                {visibleChartAreas.map((area) => (
                  <div key={area} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
                      style={{
                        backgroundColor: getTransformationAreaColor(area),
                        boxShadow: `0 0 0 1px ${getTransformationAreaColor(area)}33`,
                      }}
                    />
                    <span className="font-bold">{area}</span>
                  </div>
                ))}
              </div>
            </section>
            {/* 90-Day Grid Heatmap */}
            <section className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Flame className="h-4 w-4" />
                      </span>
                      Kalender habit
                    </h3>
                    <p className="ml-10 mt-0.5 text-xs leading-relaxed text-slate-600">
                      Catatan pelaksanaan dari hari ke hari
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-xl font-black leading-none tabular-nums text-navy-900">
                      {activeIstiqamahDays}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-slate-600">hari aktif</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-5 pb-4 pt-4">
                <div>
                  <div className="mb-3 flex justify-end">
                    <span className="text-right text-xs font-semibold tabular-nums text-slate-600">
                      {totalIstiqamahExecutions} kebiasaan tercatat
                    </span>
                  </div>
                  <div
                    className="grid grid-flow-col grid-rows-7 grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5"
                    role="img"
                    aria-label={`Kalender habit ${totalDays} hari, ${activeIstiqamahDays} hari aktif`}
                  >
                    {heatmapData.map((item) => (
                      <span
                        key={item.date}
                        title={`${item.date}: ${item.count} eksekusi Action Plan`}
                        aria-hidden="true"
                        className={`aspect-square w-full rounded-[3px] border transition-transform duration-200 hover:relative hover:z-10 hover:scale-125 ${
                          item.level === 4
                            ? "border-emerald-800 bg-emerald-700"
                            : item.level === 3
                              ? "border-emerald-700 bg-emerald-600"
                              : item.level === 2
                                ? "border-emerald-600 bg-emerald-500"
                                : item.level === 1
                                  ? "border-emerald-300 bg-emerald-200"
                                  : "border-slate-200 bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-600">
                  <span>Belum aktif</span>
                  <div
                    className="flex items-center gap-1"
                    aria-label="Intensitas istiqamah dari rendah ke tinggi"
                  >
                    <span className="mr-1">Rendah</span>
                    <span className="h-3 w-3 rounded-[3px] border border-slate-200 bg-slate-100" />
                    <span
                      className="h-3 w-3 rounded-[3px] border border-emerald-300 bg-emerald-200"
                      title="1-3 eksekusi"
                    />
                    <span
                      className="h-3 w-3 rounded-[3px] border border-emerald-600 bg-emerald-500"
                      title="4-6 eksekusi"
                    />
                    <span
                      className="h-3 w-3 rounded-[3px] border border-emerald-700 bg-emerald-600"
                      title="7-10 eksekusi"
                    />
                    <span
                      className="h-3 w-3 rounded-[3px] border border-emerald-800 bg-emerald-700"
                      title=">10 eksekusi"
                    />
                    <span className="ml-1">Tinggi</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-navy-900">
              {healthData.highestArea ? "Membaca perkembangan Anda" : "Mulai dari target Anda"}
            </h2>
            {healthData.highestArea ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs text-slate-600">Capaian tertinggi</p>
                  <p className="mt-2 font-semibold text-navy-900">{healthData.highestArea}</p>
                  <p className="mt-1 text-sm tabular-nums text-navy-900">
                    {healthData.areas[healthData.highestArea]}% dari target
                  </p>
                </div>
                {healthData.lowestArea && healthData.lowestArea !== healthData.highestArea && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-600">Perlu perhatian lebih</p>
                    <p className="mt-2 font-semibold text-navy-900">{healthData.lowestArea}</p>
                    <p className="mt-1 text-sm tabular-nums text-navy-900">
                      {healthData.areas[healthData.lowestArea]}% dari target
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Catat nilai aktual pada indikator pilihan Anda untuk melihat kemajuan. Hasil yang belum
                diisi akan ditampilkan dengan tanda “—”.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => {
                setProgressView("targets");
                requestAnimationFrame(() =>
                  document
                    .getElementById("progress-targets")
                    ?.scrollIntoView({ block: "start", behavior: "instant" }),
                );
              }}
            >
              {monthEditState === "ACTIVE" ? "Isi" : "Lihat"} capaian {periodLabel.toLowerCase()}{" "}
              {selectedMonth}
            </Button>
          </section>
        </section>
        <section
          id="progress-targets"
          aria-label="Capaian target"
          className={cn("space-y-6", progressView !== "targets" && "hidden")}
        >
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-navy-900">
                  {isTrial ? "Capaian Spiritual Growth" : "Capaian per area"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {monthEditState === "ACTIVE"
                    ? `Pelaporan ${periodLabel} Ke-${selectedMonth} dapat diisi atau diedit sampai Hari ke-${monthGraceEndDay}.`
                    : monthEditState === "LOCKED_FUTURE"
                      ? `Pelaporan ${periodLabel} Ke-${selectedMonth} baru aktif mulai Hari ke-${monthStartDay}.`
                      : `Pelaporan ${periodLabel} Ke-${selectedMonth} telah terkunci sejak Hari ke-${monthGraceEndDay + 1}.`}
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  monthEditState === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {monthEditState === "ACTIVE" ? (
                  <Edit3 className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {monthEditState === "ACTIVE"
                  ? `${periodLabel} ${selectedMonth} · Dapat diedit`
                  : monthEditState === "LOCKED_FUTURE"
                    ? `${periodLabel} ${selectedMonth} · Belum aktif`
                    : `${periodLabel} ${selectedMonth} · Terkunci`}
              </span>
            </div>
            {selectedAreas.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center space-y-3">
                <Target className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-600">
                  Lengkapi PTP Anda untuk memilih area transformasi.
                </p>
                <Link href="/journey">
                  <Button variant="outline" className="text-xs font-bold rounded-xl border-amber-400">
                    Ke Halaman PTP
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {selectedAreas.map((area) => {
                  const rep = areaReports[selectedMonth]?.[area];
                  const score = rep ? calcAreaScore(rep) : null;
                  const color = getTransformationAreaColor(area);
                  const hasFilledData = Boolean(rep?.isSaved);
                  return (
                    <div
                      key={area}
                      className={`relative flex flex-col justify-between space-y-4 rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5 ${
                        monthEditState === "ACTIVE"
                          ? "border-slate-200/80 bg-white"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 min-w-0 gap-2">
                          <span
                            className={`text-xs font-extrabold min-w-0 truncate ${monthEditState === "ACTIVE" ? "text-navy-900" : "text-slate-600"}`}
                          >
                            {area}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              score === null
                                ? "bg-slate-100 text-slate-600"
                                : score >= 80
                                  ? "bg-emerald-50 text-emerald-700"
                                  : score >= 50
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {score === null
                              ? rep?.indicators?.length
                                ? "Belum Ada Data"
                                : "Definisi Perlu Diperbaiki"
                              : `${score}% Capaian`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                          <p>Indikator ditetapkan: {indicatorCoverage[area] || 0}%</p>
                          <p>Indikator diukur: {getMeasurementCoverage(rep)}%</p>
                        </div>
                        {rep?.targets?.mainTarget && (
                          <p className="text-xs text-slate-600 line-clamp-2 italic">
                            &ldquo;{rep.targets.mainTarget}&rdquo;
                          </p>
                        )}
                        {/* 4 Dimensi — hanya tampil jika targetnya memang diisi user di PTP */}
                        {rep?.targets?.kualitas ||
                        rep?.targets?.kuantitas ||
                        rep?.targets?.waktu ||
                        rep?.targets?.biaya ? (
                          <div className="space-y-1.5 pt-1 text-xs">
                            {rep?.targets?.kualitas && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-slate-600">Rating Target PTP</span>
                                <span className="font-bold text-amber-700">{rep.targets.kualitas}</span>
                              </div>
                            )}
                            {rep?.targets?.kuantitas && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-slate-600">Realisasi Kuantitas</span>
                                <span className="font-bold text-navy-900">
                                  {rep?.kuantitasActual || "Belum Diisi"}
                                </span>
                              </div>
                            )}
                            {rep?.targets?.waktu && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-slate-600">Waktu Tepat Hari</span>
                                <span className="font-bold text-navy-900">
                                  {rep?.waktuActualDays
                                    ? `${rep.waktuActualDays}/${isTrial ? TRIAL_DAYS : 30} hari`
                                    : "Belum Diisi"}
                                </span>
                              </div>
                            )}
                            {rep?.targets?.biaya && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-slate-600">Biaya / Anggaran</span>
                                <span className="font-bold text-emerald-700">
                                  {rep?.biayaActual ? `Rp ${rep.biayaActual}` : "Belum Diisi"}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : rep?.indicators?.length ? null : (
                          <div className="pt-1 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-slate-600">Rating Evaluasi Mandiri</span>
                              <span className="font-bold text-amber-700 flex items-center gap-1">
                                {rep?.kualitasRating ? (
                                  <>
                                    {rep.kualitasRating}/5{" "}
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  </>
                                ) : (
                                  "Belum Diisi"
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {monthEditState === "ACTIVE" ? (
                        <Button
                          onClick={() => {
                            setSaveError(null);
                            setEditingAreaModal(area);
                          }}
                          className="w-full bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl min-h-11 flex items-center justify-center gap-2 mt-2"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {isTrial ? "Isi capaian pekan" : "Isi capaian bulan"}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          title={
                            monthEditState === "LOCKED_FUTURE"
                              ? `Aktif mulai Hari ke-${monthStartDay}`
                              : `Terkunci sejak Hari ke-${monthGraceEndDay + 1}${isTrial ? "" : " (lewat masa tenggang 7 hari)"}`
                          }
                          className="mt-2 flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-100"
                        >
                          {monthEditState === "LOCKED_FUTURE" ? (
                            <>
                              <Hourglass className="h-3.5 w-3.5" /> Aktif di Hari ke-{monthStartDay}
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" /> Terkunci
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        <section
          id="progress-evaluation"
          aria-label="Evaluasi perjalanan"
          className={cn("space-y-6", progressView !== "evaluation" && "hidden")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkpoint Timeline (1 col) */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="h-4 w-4 text-amber-700" />
                Jadwal evaluasi
              </h3>
              <div className="space-y-3">
                {((isTrial ? [1, 2] : [1, 2, 3]) as (1 | 2 | 3)[]).map((m) => {
                  const rev = reviews[m];
                  const isCurrent = selectedMonth === m;
                  return (
                    <button
                      key={m}
                      onClick={() => handleSelectMonth(m)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between ${
                        isCurrent ? "bg-amber-50/80 font-bold" : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold text-navy-900">
                          {isTrial ? "Evaluasi pekan " + m : "Checkpoint Bulan Ke-" + m}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {isTrial
                            ? m === 1
                              ? "Hari 1–7"
                              : "Hari 8–14"
                            : m === 1
                              ? "Evaluasi Hari 1–30"
                              : m === 2
                                ? "Evaluasi Hari 31–60"
                                : "Evaluasi Hari 61–90"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          rev.status === "ON_TRACK"
                            ? "bg-emerald-100 text-emerald-800"
                            : rev.status === "NEED_SUPPORT"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {rev.status === "ON_TRACK"
                          ? "Sesuai rencana"
                          : rev.status === "NEED_SUPPORT"
                            ? "Perlu dukungan"
                            : "Belum Diisi"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Coach Conversation Thread (2 cols) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-w-0 gap-2">
                <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2 min-w-0 truncate">
                  <MessageSquare className="h-4 w-4 text-navy-900 shrink-0" />
                  {isTrial ? "Catatan evaluasi" : "Catatan & tanggapan pendamping"} ({periodLabel}{" "}
                  {selectedMonth})
                </h3>
                <span className="text-xs text-slate-600 font-medium shrink-0">
                  {isTrial ? "Latihan mandiri" : coachName}
                </span>
              </div>
              {/* Conversation Messages */}
              <div className="space-y-3">
                {/* Participant Message */}
                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-navy-900">
                    <span>Catatan Anda (Peserta)</span>
                    <span className="text-xs font-normal text-slate-600">
                      {periodLabel} Ke-{selectedMonth}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    {note || "Belum ada catatan peserta untuk periode ini."}
                  </p>
                </div>
                {!isTrial && (
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-amber-900">Ulasan {coachName}</p>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {reviews[selectedMonth]?.coachNote || "Belum ada catatan pendamping."}
                    </p>
                  </div>
                )}
              </div>
              {/* Checkpoint Form Editor (PRESERVED UNTOUCHED AS REQUESTED) */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label htmlFor="checkpoint-note" className="block text-xs font-bold text-slate-700">
                      {isTrial ? "Catatan pekan" : "Catatan checkpoint bulan"} ke-{selectedMonth}
                    </label>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      {monthEditState === "ACTIVE"
                        ? `Dapat diedit sampai Hari ke-${monthGraceEndDay}.`
                        : monthEditState === "LOCKED_FUTURE"
                          ? `Aktif mulai Hari ke-${monthStartDay}.`
                          : `Terkunci sejak Hari ke-${monthGraceEndDay + 1}.`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() => setStatus("ON_TRACK")}
                      disabled={monthEditState !== "ACTIVE"}
                      className={`min-h-11 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        status === "ON_TRACK"
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-600"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isTrial ? "Sesuai rencana" : "Sesuai rencana"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("NEED_SUPPORT")}
                      disabled={monthEditState !== "ACTIVE"}
                      className={`min-h-11 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        status === "NEED_SUPPORT"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isTrial ? "Ada kendala" : "Perlu dukungan"}
                    </button>
                  </div>
                </div>
                <Textarea
                  id="checkpoint-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={monthEditState !== "ACTIVE"}
                  placeholder="Tuliskan kendala atau keberhasilan Anda periode ini..."
                  className="text-xs border-slate-200 focus:border-amber-400 rounded-xl resize-none disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving || monthEditState !== "ACTIVE"}
                    className="h-10 w-full rounded-xl bg-[#071A33] px-5 text-xs font-bold text-amber-300 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-600 sm:w-auto"
                  >
                    {monthEditState !== "ACTIVE" ? (
                      <>
                        <Lock className="mr-1.5 h-3.5 w-3.5" /> Tidak dapat diedit
                      </>
                    ) : saving ? (
                      "Menyimpan..."
                    ) : saved ? (
                      "Tersimpan"
                    ) : isTrial ? (
                      "Simpan catatan pekan"
                    ) : (
                      "Simpan catatan checkpoint"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6 ${finalReflectionUnlocked ? "border-slate-200/80 bg-white" : "border-slate-200 bg-slate-50/80"}`}
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${finalReflectionUnlocked ? "bg-amber-50 text-amber-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {finalReflectionUnlocked ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy-900 sm:text-base">
                    Refleksi akhir program
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
                    {finalReflectionUnlocked
                      ? "Rangkum pembelajaran utama, perubahan nyata, dan komitmen untuk melanjutkan kebiasaan baik."
                      : "Bagian ini dibuka menjelang akhir perjalanan agar refleksi merangkum proses secara utuh."}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${finalReflectionUnlocked ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
              >
                {finalReflectionUnlocked
                  ? "Terbuka"
                  : `Terbuka Hari ke-${firstReflectionDay} · ${Math.max(0, firstReflectionDay - dayCount)} hari lagi`}
              </span>
            </div>
            <Textarea
              rows={4}
              value={finalReflection}
              onChange={(e) => setFinalReflection(e.target.value)}
              disabled={!finalReflectionUnlocked}
              maxLength={3000}
              placeholder="Tuliskan refleksi & komitmen keberlanjutan Anda..."
              className="mt-4 min-h-[140px] resize-none rounded-xl border-slate-200 text-xs leading-relaxed focus:border-amber-400 disabled:bg-white/60 disabled:text-slate-600 disabled:opacity-100"
            />
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium text-slate-600">
                {finalReflection.length}/3000 karakter
              </span>
              <Button
                onClick={handleSaveReflection}
                disabled={
                  savingReflection || !journeyId || !finalReflectionUnlocked || !finalReflection.trim()
                }
                className="h-10 w-full rounded-xl bg-[#071A33] px-5 text-xs font-bold text-amber-300 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-600 sm:w-auto"
              >
                {!finalReflectionUnlocked ? (
                  <>
                    <Lock className="mr-1.5 h-3.5 w-3.5" /> Belum tersedia
                  </>
                ) : savingReflection ? (
                  "Menyimpan..."
                ) : savedReflection ? (
                  "Tersimpan"
                ) : (
                  "Simpan refleksi akhir"
                )}
              </Button>
            </div>
          </div>
        </section>
        <details className="rounded-2xl border border-slate-200/80 bg-white p-5 text-sm leading-6 text-slate-600">
          <summary className="cursor-pointer font-semibold text-navy-900">
            Cara membaca hasil & langkah berikutnya
          </summary>
          <div className="mt-4 space-y-4">
            <dl className="space-y-4">
              <div>
                <dt className="font-medium text-navy-900">Capaian target</dt>
                <dd>
                  Perubahan dari kondisi awal menuju target, berdasarkan nilai aktual yang Anda isi pada
                  periode yang dipilih.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-navy-900">Pelaksanaan habit</dt>
                <dd>
                  Seberapa konsisten kebiasaan dijalankan sesuai jadwal sejak awal program. Angka ini
                  memakai jadwal dan jumlah pelaksanaan tiap habit.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-navy-900">Belum ada data</dt>
                <dd>Tanda “—” berarti hasil belum dapat dihitung. Ini tidak sama dengan nilai nol.</dd>
              </div>
            </dl>
            <p>
              Gunakan tab Capaian untuk mencatat nilai aktual, lalu tab Evaluasi untuk menuliskan
              kemajuan dan kendala Anda.
            </p>
            {isTrial && (
              <Link
                href="/trial/result"
                className="inline-flex min-h-11 items-center font-medium text-navy-900 underline underline-offset-4"
              >
                Lihat ringkasan 14 hari
              </Link>
            )}
          </div>
        </details>
        {/* ─── MODAL DRAWER: INPUT 4 DIMENSI INDIKATOR ─────────────────────── */}
        {editingAreaModal && (
          <Dialog open={!!editingAreaModal} onOpenChange={() => setEditingAreaModal(null)}>
            {/* Mobile: bottom-sheet menempel di bawah layar, tinggi maks 90vh + scroll.
                Desktop (sm ke atas): kembali ke dialog di tengah seperti semula. */}
            <DialogContent
              className="left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0 w-full max-w-full
                         rounded-t-3xl rounded-b-none max-h-[90dvh] overflow-y-auto
                         sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                         sm:max-w-xl sm:rounded-2xl sm:max-h-[85dvh]
                         bg-white border border-slate-200 shadow-2xl p-5 sm:p-6"
            >
              {/* Drag handle indicator khusus mobile */}
              <div className="sm:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />

              <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="text-base font-black text-navy-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-700 shrink-0" />
                  <span className="truncate">Capaian target: {editingAreaModal}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600">
                  {isTrial
                    ? "Catat capaian Anda untuk pekan ini. Untuk target jumlah, masukkan total sejak hari pertama."
                    : "Input realisasi bulan ke-" + selectedMonth + ". Skor keberhasilan dihitung otomatis."}
                </DialogDescription>
              </DialogHeader>
              {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{saveError}</p>}

              {(() => {
                const rep = areaReports[selectedMonth]?.[editingAreaModal];
                if (!rep) return null;
                const overallPct = calcAreaScore(rep);

                if (monthEditState !== "ACTIVE") {
                  return (
                    <div className="py-6 space-y-3 text-center">
                      {monthEditState === "LOCKED_FUTURE" ? (
                        <>
                          <Hourglass className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="text-sm text-slate-600">
                            Input untuk {periodLabel} Ke-{selectedMonth} baru aktif mulai <b>Hari ke-{monthStartDay}</b>.
                          </p>
                        </>
                      ) : (
                        <>
                          <Lock className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="text-sm text-slate-600">
                            {periodLabel} {selectedMonth} selesai. Data tetap dapat dibaca.
                          </p>
                        </>
                      )}
                      <DialogFooter className="pt-2 justify-center">
                        <Button variant="outline" onClick={() => setEditingAreaModal(null)} className="text-xs font-semibold rounded-xl h-9">
                          Tutup
                        </Button>
                      </DialogFooter>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 py-2">
                    {/* User PTP Target Context Banner */}
                    {rep.targets.mainTarget && (
                      <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-1">
                        <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">Sasaran Target PTP Anda:</span>
                        <p className="text-xs font-medium text-navy-900 italic leading-relaxed">&ldquo;{rep.targets.mainTarget}&rdquo;</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Skor Capaian Area:</span>
                       <span className="text-sm font-extrabold text-emerald-600">{overallPct === null ? "Belum Ada Data" : `${overallPct}% Berhasil`}</span>
                    </div>

                         {rep.indicators?.length ? (
                           <div className="space-y-3">
                             {rep.indicators.filter(indicator => indicator.active).map(indicator => {
                               const suggested = computeSuggestedActual(indicator);
                               const qualityDesc = indicator.type === "quality" ? getQualityRubricDescription(indicator.qualityRubric, typeof rep.indicatorActuals?.[indicator.key] === "number" ? (rep.indicatorActuals[indicator.key] as number) : null) : null;
                               return (
                               <div key={indicator.key} className="rounded-xl border border-slate-200 bg-white p-3">
                                 <div className="mb-2 flex items-center justify-between gap-2"><label htmlFor={`actual-${indicator.key}`} className="text-xs font-bold text-slate-700">{indicator.label}</label><div className="flex items-center gap-1.5"><Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[9px] font-bold">{sourceLabel(indicator.actualSource)}</Badge><span className="text-xs text-slate-600">Target {indicator.target} {indicator.unit}</span></div></div>
                                 <Input id={`actual-${indicator.key}`} type="number" value={rep.indicatorActuals?.[indicator.key] ?? ""} onChange={event => {
                                    const value = event.target.value === "" ? undefined : Number(event.target.value);
                                    if (value !== undefined && (!Number.isFinite(value) || value < 0)) return;
                                    setAreaReports(current => ({ ...current, [selectedMonth]: { ...current[selectedMonth], [editingAreaModal]: { ...current[selectedMonth][editingAreaModal], indicatorActuals: { ...current[selectedMonth][editingAreaModal].indicatorActuals, [indicator.key]: value } } } }));
                                  }} min={0} placeholder={`Aktual (${indicator.unit || "angka"})`} className="h-9 text-xs" />
                                 <p className="mt-2 text-xs text-slate-600">{indicator.type === "quality" ? "Kualitas" : indicator.type === "quantity" ? "Kuantitas" : indicator.type === "time" ? "Waktu" : "Efisiensi/Biaya"} · Kondisi saat ini {indicator.baseline} · Target 90 hari {indicator.target} · {indicator.direction === "higher_is_better" ? "Naik lebih baik" : "Turun lebih baik"} · {indicator.unit || "Satuan belum tersedia"}</p>
                                 {indicator.actualSource === "action_plan" && (
                                   <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                                     <span className="text-xs leading-snug text-slate-600">{indicator.linkedActionPlanIds?.length ? `Terhubung ke ${indicator.linkedActionPlanIds.length} Action Plan · nilai otomatis dari tracking habit` : "Belum ada Action Plan terhubung"}</span>
                                     {suggested !== null && (
                                       <button type="button" onClick={() => setAreaReports(current => ({ ...current, [selectedMonth]: { ...current[selectedMonth], [editingAreaModal]: { ...current[selectedMonth][editingAreaModal], indicatorActuals: { ...current[selectedMonth][editingAreaModal].indicatorActuals, [indicator.key]: suggested } } } }))} className="shrink-0 text-xs font-bold text-amber-700 hover:underline cursor-pointer">Pakai {suggested} dari habit</button>
                                     )}
                                   </div>
                                 )}
                                 {qualityDesc && <p className="mt-1 text-xs font-semibold text-slate-600">Rubrik kualitas: {qualityDesc}</p>}
                                 <Input value={rep.indicatorEvidenceNotes?.[indicator.key] || ""} onChange={event => setAreaReports(current => ({ ...current, [selectedMonth]: { ...current[selectedMonth], [editingAreaModal]: { ...current[selectedMonth][editingAreaModal], indicatorEvidenceNotes: { ...current[selectedMonth][editingAreaModal].indicatorEvidenceNotes, [indicator.key]: event.target.value } } } }))} placeholder="Catatan bukti (opsional)" className="mt-2 h-9 text-xs" />
                              </div>
                               );
                             })}
                           </div>
                         ) : !rep.targets.kualitas && !rep.targets.kuantitas && !rep.targets.waktu && !rep.targets.biaya ? (
                      <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-amber-900 text-xs block">Rating Capaian {periodLabel} (1 – 5 Bintang)</label>
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                             {rep.kualitasRating ? `${rep.kualitasRating}/5 ★ (${rep.kualitasRating * 20}% Capaian)` : "Belum Diisi"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Berikan penilaian mandiri atas kualitas keberhasilan & pencapaian Anda pada area ini di {periodLabel} Ke-{selectedMonth}.
                        </p>
                        <div className="flex justify-center items-center gap-2 py-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateAreaReport(editingAreaModal, "kualitasRating", star)}
                              className="transition-transform hover:scale-125 cursor-pointer p-1"
                            >
                               <Star className={`h-8 w-8 ${star <= (rep.kualitasRating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* 1. Kualitas */}
                        {rep.targets.kualitas && <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200 space-y-2">
                          <label className="font-bold text-purple-800 block">1. Kualitas (Mutu / Kekhusyukan)</label>
                          <p className="text-xs text-slate-600">Target PTP: {rep.targets.kualitas || "Khusyu & Tepat waktu"}</p>
                          <div className="flex gap-1 py-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => updateAreaReport(editingAreaModal, "kualitasRating", star)}
                                className="transition-transform hover:scale-125"
                              >
                                 <Star className={`h-5 w-5 ${star <= (rep.kualitasRating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                              </button>
                            ))}
                             <span className="text-xs font-bold text-slate-600 ml-1 self-center">{rep.kualitasRating ? `${rep.kualitasRating}/5 ★` : "Belum Diisi"}</span>
                          </div>
                        </div>}

                        {/* 2. Kuantitas */}
                        {rep.targets.kuantitas && <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 space-y-2">
                          <label className="font-bold text-blue-800 block">2. Kuantitas (Realisasi)</label>
                          <p className="text-xs text-slate-600">Target PTP: {rep.targets.kuantitas || "Target PTP"}</p>
                          <div className="space-y-1.5">
                            <Input
                              value={rep.kuantitasActual}
                              onChange={e => updateAreaReport(editingAreaModal, "kuantitasActual", e.target.value)}
                              placeholder="Realisasi periode ini (misal: 95)"
                              className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>}

                        {/* 3. Waktu */}
                        {rep.targets.waktu && <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-2">
                          <label className="font-bold text-amber-800 block">3. Waktu (Hari Tepat Waktu)</label>
                          <p className="text-xs text-slate-600">Target PTP: {rep.targets.waktu || "Jadwal Tepat Waktu"}</p>
                          <Input
                            type="number" min={0} max={isTrial ? 14 : 30}
                            value={rep.waktuActualDays}
                            onChange={e => updateAreaReport(editingAreaModal, "waktuActualDays", e.target.value)}
                            placeholder={isTrial ? "Hari tepat waktu selama trial" : "Hari tepat waktu dari 30 (misal: 25)"}
                            className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                          />
                        </div>}

                        {/* 4. Biaya */}
                        {rep.targets.biaya && <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                          <label className="font-bold text-emerald-800 block">4. Biaya / Anggaran (Nominal)</label>
                          <p className="text-xs text-slate-600">Target PTP: {rep.targets.biaya || "Nominal Rp"}</p>
                          <Input
                            value={rep.biayaActual}
                            onChange={e => updateAreaReport(editingAreaModal, "biayaActual", e.target.value)}
                            placeholder="Nominal realisasi (misal: 600000)"
                            className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                          />
                        </div>}
                      </div>
                    )}

                    <DialogFooter className="border-t border-slate-100 pt-3 sticky bottom-0 bg-white">
                      <Button variant="outline" onClick={() => setEditingAreaModal(null)} className="w-full sm:w-auto text-xs font-semibold rounded-xl h-11 sm:h-9">
                        Batal
                      </Button>
                      <Button
                        onClick={() => handleSaveIndReport(editingAreaModal)}
                        disabled={savingArea === editingAreaModal}
                        className="w-full sm:w-auto bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-11 sm:h-9 px-5"
                      >
                        {savingArea === editingAreaModal ? "Menyimpan..." : isTrial ? "Simpan capaian pekan" : "Simpan Capaian Bulanan"}
                      </Button>
                    </DialogFooter>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}

      </div>
    </ParticipantLayout>
  );
}
