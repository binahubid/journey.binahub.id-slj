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
  Lock,
  Hourglass,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTransformationAreaColor, normalizeTransformationArea } from "@/lib/transformation-areas";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { getActiveProgramMonth, getMonthEditState, getProgramDay } from "@/lib/program-timeline";
import Link from "next/link";
import { calculateAreaOutcome, calculateExecutionMomentumDelta, calculateIndicatorCoverage, calculateIndicatorOutcomes, calculateScheduledHabitCompletion, type IndicatorDefinition } from "@/lib/assessment-methodology";
import { addCalendarDays, getLocalDateString, resolveParticipantTimeZone } from "@/lib/local-date";

type HabitFrequency = "daily" | "weekly" | "unsupported";
type AreaExecutionStatus = "MEASURED" | "NOT_MEASURED" | "UNSUPPORTED";
type ChartPoint = {
  date: string;
  day: string;
  programDay: number | null;
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

function getCompletedUnits(log: any, quantity: number): number {
  if (!log) return 0;
  const count = Number(log.completed_count);
  if (Number.isFinite(count) && count > 0) return count;
  return log.completed ? quantity : 0;
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
  const [saveError, setSaveError] = useState<string | null>(null);

  // Timeframe filter state: '1d' | '7d' | '1m' | '3m'
  const [timeframe, setTimeframe] = useState<"7d" | "1m" | "3m">("7d");
  const [chartArea, setChartArea] = useState<string>("all");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [areaActionPlanCounts, setAreaActionPlanCounts] = useState<Record<string, number>>({});
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number; level: number }[]>([]);
  const [habitConsistencyPct, setHabitConsistencyPct] = useState<number>(0);
  const [indicatorCoverage, setIndicatorCoverage] = useState<Record<string, number>>({});
  const [areaExecutionStatuses, setAreaExecutionStatuses] = useState<Record<string, AreaExecutionStatus>>({});

  // Modal Drawer for 4-Dimension Indicator Update
  const [editingAreaModal, setEditingAreaModal] = useState<string | null>(null);

  // ── Load Data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile & Day Count
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      let initialMonth: 1 | 2 | 3 = 1;
      if (profile) {
        setUserName(profile.full_name || "Peserta SLJ");
        if (profile.start_date) {
          const currentDay = getProgramDay(profile.start_date);
          initialMonth = getActiveProgramMonth(currentDay) ?? 1;
          setDayCount(currentDay);
          setSelectedMonth(initialMonth);
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
      setStatus(revMap[initialMonth]?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
      setNote(revMap[initialMonth]?.participantNote || "");

      // Journey (areas + targets)
      const { data: journey } = await supabase.from("journeys")
        .select("id, area_transformasi, main_target, final_reflection")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();

      if (!journey) { setLoading(false); return; }

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
        .select("id, area, indicator_key, indicator_type, label, active, direction, baseline_value, target_value, unit")
        .eq("journey_id", journey.id).order("created_at", { ascending: true });
      const structuredAvailable = !indicatorsError;
      if (indicatorsError && indicatorsError.code !== "42P01" && indicatorsError.code !== "PGRST205") throw indicatorsError;
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

      // Fetch Action Plans (untuk area_category) + Habits (untuk cocok dengan habit_logs.habit_id)
      // PENTING: habit_logs.habit_id mengacu ke habits.id, BUKAN action_plans.id — keduanya tabel
      // berbeda. Sebelumnya kode ini salah mencocokkan habit_id langsung ke action_plans.id
      // sehingga log check-in harian tidak pernah ketemu (chart selalu flat/kosong).
      let { data: actionPlans, error: actionPlansError } = await supabase.from("action_plans")
        .select("*").eq("journey_id", journey.id);
      if (actionPlansError) throw actionPlansError;

      if (!actionPlans || actionPlans.length === 0) {
        const fallback = await supabase.from("action_plans").select("*").eq("user_id", user.id);
        if (fallback.error) throw fallback.error;
        actionPlans = fallback.data;
      }

      const { data: habitsList, error: habitsError } = await supabase.from("habits")
        .select("*").eq("user_id", user.id);
      if (habitsError) throw habitsError;

      const apAreaMap: Record<string, string> = {};
      (actionPlans || []).forEach((ap: any) => {
        const area = normalizeTransformationArea(ap.area_category || ap.category || "Spiritual Growth");
        apAreaMap[ap.id] = area;
      });

      const planCounts: Record<string, number> = {};
      areas.forEach(area => { planCounts[area] = 0; });
      (actionPlans || []).forEach((ap: any) => {
        const area = apAreaMap[ap.id];
        if (areas.includes(area)) planCounts[area] += 1;
      });
      setAreaActionPlanCounts(planCounts);

      const activeHabits = (habitsList || []).filter((h: any) => h.is_archived !== true);
      const habitsWithArea: { id: string; actionPlanId: string; area: string; qty: number; frequency: HabitFrequency; effectiveFrom?: string; effectiveUntil?: string }[] = [];
      const usedHabitIds = new Set<string>();

      // Action Plan is the source of truth for area. Matching by title supports legacy habits.
      (actionPlans || []).forEach((ap: any) => {
        const area = apAreaMap[ap.id];
        if (!areas.includes(area)) return;
        const habit = activeHabits.find((h: any) =>
          !usedHabitIds.has(h.id) &&
          h.action_plan_id === ap.id ||
          (!usedHabitIds.has(h.id) && String(h.title || "").trim().toLowerCase() === String(ap.title || "").trim().toLowerCase())
        );
        if (!habit) {
          // Keep the Action Plan in the area denominator even while its Habit row is being repaired.
          habitsWithArea.push({
            id: `missing:${ap.id}`,
            actionPlanId: ap.id,
            area,
            qty: normalizeHabitQuantity(ap.quantity, ap.target),
            frequency: normalizeHabitFrequency(ap.frequency),
          });
          return;
        }
        usedHabitIds.add(habit.id);
        habitsWithArea.push({
          id: habit.id,
          actionPlanId: ap.id,
          area,
          qty: normalizeHabitQuantity(habit.quantity, habit.target, ap.quantity, ap.target),
          frequency: normalizeHabitFrequency(habit.frequency),
          effectiveFrom: habit.effective_from || undefined,
          effectiveUntil: habit.effective_until || undefined,
        });
      });

      // Build the timeline using the participant's calendar, not the browser's UTC date.
      const numDays = timeframe === "7d" ? 7 : timeframe === "1m" ? 30 : 90;
      const today = new Date();
      const participantTimeZone = resolveParticipantTimeZone(
        profile?.timezone,
        profile?.timezone_mode === "MANUAL" ? "MANUAL" : "AUTO"
      );
      const todayStr = getLocalDateString(today, participantTimeZone);
      const datesArr = Array.from({ length: numDays }, (_, index) => addCalendarDays(todayStr, index - numDays + 1));

      const profileStartDate = profile?.start_date
        ? String(profile.start_date).slice(0, 10)
        : datesArr[0];
      const programEndDate = addCalendarDays(profileStartDate, 89);
      // Day 0 is the calendar day immediately before the participant starts.
      const accumulationStartDate = addCalendarDays(profileStartDate, -1);
      const accumulationEndDate = todayStr < programEndDate ? todayStr : programEndDate;
      const accumulationDates: string[] = [];
      if (accumulationStartDate <= accumulationEndDate) {
        for (let dateStr = accumulationStartDate; dateStr <= accumulationEndDate; dateStr = addCalendarDays(dateStr, 1)) {
          accumulationDates.push(dateStr);
        }
      }

      // Include the full program period so every timeframe starts from the true running balance.
      const [habitLogsRes] = await Promise.all([
        supabase
          .from("habit_logs")
           .select("habit_id, date, activity_date, completed, completed_count")
           .eq("user_id", user.id)
           .gte("date", getMondayWeekStart(accumulationStartDate))
           .lte("date", accumulationEndDate),
      ]);
      if (habitLogsRes.error) throw habitLogsRes.error;

      const habitLogs = habitLogsRes.data || [];

      if (areas.length > 0) {
        const habitExecution = Object.fromEntries(habitsWithArea.map(habit => [habit.id, {
          scheduled: 0,
          completed: 0,
          currentWeek: "",
          currentWeekCompleted: 0,
        }]));
        const momentumByArea: Record<string, number> = Object.fromEntries(areas.map(area => [area, 0]));
        const formatChartLabel = (dateStr: string) => {
          const dObj = new Date(`${dateStr}T12:00:00Z`);
          return numDays <= 7
            ? dObj.toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" })
            : `${dObj.getUTCDate()}/${dObj.getUTCMonth() + 1}`;
        };

        const cumulativeChart: ChartPoint[] = accumulationDates.map((dateStr, programIndex) => {
          const isDayZero = dateStr === accumulationStartDate;

          if (!isDayZero) {
            const logsForDay = habitLogs.filter((l: any) => (l.activity_date || l.date) === dateStr);
            habitsWithArea.forEach(habit => {
              if (
                habit.frequency === "unsupported" ||
                (habit.effectiveFrom && habit.effectiveFrom > dateStr) ||
                (habit.effectiveUntil && habit.effectiveUntil < dateStr)
              ) return;

              const execution = habitExecution[habit.id];
              const log = habit.id.startsWith("missing:") ? null : logsForDay.find((item: any) => item.habit_id === habit.id);
              if (habit.frequency === "daily") {
                const completedUnits = Math.min(habit.qty, getCompletedUnits(log, habit.qty));
                execution.scheduled += habit.qty;
                execution.completed += completedUnits;
                momentumByArea[habit.area] += calculateExecutionMomentumDelta({ scheduledUnits: habit.qty, completedUnits });
                return;
              }

              const weekStart = getMondayWeekStart(dateStr);
              if (execution.currentWeek !== weekStart) {
                execution.currentWeek = weekStart;
                execution.currentWeekCompleted = 0;
                execution.scheduled += habit.qty;
              }
              const available = habit.qty - execution.currentWeekCompleted;
              const completed = Math.min(available, getCompletedUnits(log, habit.qty));
              execution.currentWeekCompleted += completed;
              execution.completed += completed;
              momentumByArea[habit.area] += completed;

              const dayOfWeek = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
              if (dayOfWeek === 0) {
                momentumByArea[habit.area] -= Math.max(0, habit.qty - execution.currentWeekCompleted);
              }
            });
          }

          const scores: Record<string, number | null> = {};
          areas.forEach(area => {
            if (isDayZero) {
              scores[area] = 0;
              return;
            }
            scores[area] = momentumByArea[area];
          });
          return { date: dateStr, day: formatChartLabel(dateStr), programDay: programIndex, scores };
        });

        const executionStatuses: Record<string, AreaExecutionStatus> = {};
        const measuredAreaScores: number[] = [];
        areas.forEach(area => {
          const areaHabits = habitsWithArea.filter(habit => habit.area === area);
          const hasUnsupportedSchedule = areaHabits.some(habit => habit.frequency === "unsupported");
          const measuredHabits = areaHabits.filter(habit => habit.frequency !== "unsupported" && habitExecution[habit.id].scheduled > 0);
          if (hasUnsupportedSchedule) {
            executionStatuses[area] = "UNSUPPORTED";
          } else if (measuredHabits.length === 0) {
            executionStatuses[area] = "NOT_MEASURED";
          } else {
            executionStatuses[area] = "MEASURED";
            measuredAreaScores.push(Math.round(measuredHabits.reduce((sum, habit) => sum + (calculateScheduledHabitCompletion({
              scheduledOccurrences: habitExecution[habit.id].scheduled,
              completedOccurrences: habitExecution[habit.id].completed,
            }).score || 0), 0) / measuredHabits.length));
          }
        });
        setAreaExecutionStatuses(executionStatuses);
        setHabitConsistencyPct(measuredAreaScores.length
          ? Math.round(measuredAreaScores.reduce((sum, score) => sum + score, 0) / measuredAreaScores.length)
          : 0);

        const cumulativeByDate = new Map(cumulativeChart.map(point => [point.date, point]));
        setChartData(datesArr.map(dateStr => cumulativeByDate.get(dateStr) || {
          date: dateStr,
          day: formatChartLabel(dateStr),
          programDay: null,
          scores: Object.fromEntries(areas.map(area => [area, null])),
        }));
      }

      // Build 90-Day Heatmap Data & Calculate Real Habit Consistency %
      const dates90: string[] = [];
      for (let i = 89; i >= 0; i--) dates90.push(addCalendarDays(todayStr, -i));

      const { data: logs90 } = await supabase.from("habit_logs")
        .select("habit_id, date, activity_date, completed, completed_count")
        .eq("user_id", user.id)
        .gte("date", addCalendarDays(todayStr, -95))
        .lte("date", todayStr);

      const heatmap = dates90.map(dateStr => {
        const activeHabits = habitsWithArea.filter(h =>
          dateStr >= profileStartDate && dateStr <= programEndDate &&
          (!h.effectiveFrom || h.effectiveFrom <= dateStr) &&
          (!h.effectiveUntil || h.effectiveUntil >= dateStr)
        );
        const dayLogs = (logs90 || []).filter((l: any) => (l.activity_date || l.date) === dateStr);
        const completedCount = activeHabits.reduce((sum, h) => {
          const log = h.id.startsWith("missing:") ? null : dayLogs.find((l: any) => l.habit_id === h.id);
          return sum + getCompletedUnits(log, h.qty);
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
      setSaveError(`Data monitoring gagal dimuat${error?.message ? `: ${error.message}` : "."}`);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const buildEmptyReport = (area: string, targets: AreaIndicatorTargets, baselineScore?: number): AreaReport => ({
    area, targets, kualitasRating: null,
    kuantitasBaseline: "", kuantitasActual: "", waktuActualDays: "", biayaActual: "",
    isSaved: false, baselineScore,
  });

  const handleSelectMonth = (month: 1 | 2 | 3) => {
    setEditingAreaModal(null);
    setSelectedMonth(month);
    const rev = reviews[month];
    setStatus(rev?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
    setNote(rev?.participantNote || "");
  };

  const handleSave = async () => {
    if (getMonthEditState(selectedMonth, dayCount) !== "ACTIVE") {
      setSaveError(
        getMonthEditState(selectedMonth, dayCount) === "LOCKED_FUTURE"
          ? `Checkpoint Bulan Ke-${selectedMonth} belum aktif.`
          : `Checkpoint Bulan Ke-${selectedMonth} sudah terkunci dan tidak dapat diedit.`
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
    if (getMonthEditState(selectedMonth, dayCount) !== "ACTIVE") return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !journeyId) return;
    const rep = areaReports[selectedMonth]?.[area];
    if (!rep) return;
    setSavingArea(area);
    setSaveError(null);
    const invalidActual = (rep.indicators || []).some((indicator) => indicator.active && rep.indicatorActuals?.[indicator.key] !== undefined && (!Number.isFinite(rep.indicatorActuals[indicator.key]) || (rep.indicatorActuals[indicator.key] as number) < 0));
    if (invalidActual) {
      setSaveError(`${area}: actual indikator harus berupa angka valid dan tidak boleh negatif.`);
      return;
    }
    const usesLegacyRating = !rep.indicators?.length && (!rep.targets.kualitas && !rep.targets.kuantitas && !rep.targets.waktu && !rep.targets.biaya || Boolean(rep.targets.kualitas));
    if (usesLegacyRating && rep.kualitasRating === null) {
      setSaveError(`${area}: rating evaluasi mandiri belum diisi.`);
      setSavingArea(null);
      return;
    }
    const overallPct = calcAreaScore(rep);
    try {
      const { error } = await supabase.from("monthly_indicator_reports").upsert({
        user_id: user.id,
        journey_id: journeyId,
        month_number: selectedMonth,
        area,
        kualitas_actual_rating: rep.kualitasRating,
        kuantitas_baseline: parseFloat(rep.kuantitasBaseline) || null,
        kuantitas_actual: parseFloat(rep.kuantitasActual) || null,
        waktu_actual_days: parseFloat(rep.waktuActualDays) || null,
        biaya_actual: parseFloat(rep.biayaActual.replace(/[^0-9.]/g, "")) || null,
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
    if (!journeyId || dayCount < 89) {
      setSaveError("Refleksi akhir program baru dapat diisi mulai Hari ke-89.");
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
  const daysRemaining = Math.max(0, 90 - dayCount);
  const nextCheckpointMonth = dayCount <= 30 ? 1 : dayCount <= 60 ? 2 : 3;
  const daysToNextCheckpoint = dayCount <= 30 ? 30 - dayCount : dayCount <= 60 ? 60 - dayCount : Math.max(0, 90 - dayCount);

  // Proyeksi Kelulusan Real
  const projectedOverallPct = healthData.overall === null ? null : Math.min(100, Math.round((healthData.overall + habitConsistencyPct) / 2));

  // Guilt-Free UX Helper for New Participants (< 7 days or no entries)
  const isEarlyStage = dayCount <= 7;

  // Status kunci/aktif untuk input capaian bulan yang sedang dipilih
  const monthEditState = getMonthEditState(selectedMonth, dayCount);
  const monthStartDay = (selectedMonth - 1) * 30 + 1;
  const monthGraceEndDay = selectedMonth * 30 + 7;
  const finalReflectionUnlocked = dayCount >= 89;

  const visibleChartAreas = chartArea === "all" || !selectedAreas.includes(chartArea) ? selectedAreas : [chartArea];
  const chartMomentumValues = chartData.flatMap(point => visibleChartAreas.flatMap(area => {
    const value = point.scores[area];
    return value === null || value === undefined ? [] : [value];
  }));
  const chartMomentumMin = Math.min(0, ...chartMomentumValues);
  const chartMomentumMax = Math.max(0, ...chartMomentumValues);
  const chartMomentumSpan = Math.max(4, chartMomentumMax - chartMomentumMin);
  const chartMomentumPadding = Math.max(2, Math.ceil(chartMomentumSpan * 0.15));
  const chartScaleMin = chartMomentumMin - chartMomentumPadding;
  const chartScaleMax = chartMomentumMax + chartMomentumPadding;
  const chartScaleRange = chartScaleMax - chartScaleMin;
  const chartY = (value: number) => 160 - ((value - chartScaleMin) / chartScaleRange) * 144;
  const chartZeroY = chartY(0);
  const chartAxisValues = Array.from({ length: 5 }, (_, index) => Math.round(chartScaleMax - index * (chartScaleRange / 4)));
  const chartLabelInterval = Math.max(1, Math.ceil(chartData.length / 7));
  const visibleChartLabels = chartData
    .map((row, index) => ({ ...row, index }))
    .filter(({ index }) => index === 0 || index === chartData.length - 1 || index % chartLabelInterval === 0);
  const chartDayZeroIndex = chartData.findIndex(point => point.programDay === 0);
  const activeIstiqamahDays = heatmapData.filter(item => item.count > 0).length;
  const totalIstiqamahExecutions = heatmapData.reduce((total, item) => total + item.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!journeyId) {
    return (
      <ParticipantLayout activePath="/monitoring" pageTitle="Monitoring Perjalanan SLJ">
        <main className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <Target className="h-10 w-10 text-amber-600 mx-auto" />
          <h1 className="text-xl font-black text-navy-900">PTP belum siap dimonitor</h1>
          <p className="text-sm text-slate-600">Pilih tiga area transformasi, isi target, dan buat Action Plan terlebih dahulu.</p>
          <Link href="/journey"><Button className="bg-navy-900 text-amber-300">Lengkapi PTP</Button></Link>
        </main>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout activePath="/monitoring" pageTitle="Monitoring Perjalanan SLJ">
      {/* Full-width container with clean whitespace */}
      <main className="w-full pt-6 pb-16 font-sans text-slate-800">
        {saveError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        
        {/* Two-column layout: Left Main Content (70%), Right Analytics & Guidance Sidebar (30%) */}
        <div className="flex flex-col xl:flex-row gap-7 items-start">

          {/* ─── LEFT MAIN CONTENT COLUMN ───────────────────────────────────── */}
          <div className="flex-1 w-full space-y-7 min-w-0">

            {/* ─── 1. HERO BANNER (Solid Dark Navy - No Gradient) ───────────── */}
            <div className="bg-[#071A33] text-white p-4 sm:p-8 rounded-3xl shadow-xs">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Hari ke-{Math.min(90, dayCount)} dari 90 Hari
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">
                      Evaluasi Bulan Ke-{selectedMonth}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                    Monitoring Perjalanan {userName.split(" ")[0]}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Evaluasi reflektif progres 90 hari & kedisiplinan habit harian Anda secara konsisten.
                  </p>

                  {/* Progress Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        Journey Health Score {isEarlyStage && "(Skor Awal dari Baseline)"}
                      </span>
                      <span className="font-extrabold text-amber-300">
                        {healthData.overall === null ? "Belum Ada Data" : `${healthData.overall}%`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${healthData.overall === null ? 0 : Math.max(4, healthData.overall)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Card: Next Checkpoint Widget (Solid Fill) */}
                <div className="bg-white/10 p-4 rounded-2xl shrink-0 w-full lg:w-64 space-y-3">
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
                  const score = healthData.areas[area] ?? null;
                  const color = getTransformationAreaColor(area);
                  const rep = areaReports[selectedMonth]?.[area];
                  const hasFilledData = Boolean(rep?.isSaved);

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
                          {score === null ? "--" : `${score}%`}
                        </span>

                        {/* Badge: bedakan skor awal (dari baseline, belum ada laporan bulan ini) vs capaian nyata */}
                        {score === null ? (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Belum Ada Data
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
                      <p className="text-[10px] font-semibold text-slate-500">Behavior Execution: {
                        areaExecutionStatuses[area] === "UNSUPPORTED"
                          ? "Tidak Dapat Dihitung"
                          : areaExecutionStatuses[area] === "MEASURED"
                          ? "Diukur dari occurrence terjadwal"
                          : "Tidak Diukur"
                      }</p>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score === null ? 0 : Math.max(3, score)}%`, backgroundColor: color }}
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

            {/* ─── 3. PROGRESS ANALYTICS & 90-DAY GRID ─────────────────────────── */}
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
                       Momentum Action Plan
                    </h3>
                    <p className="ml-10 mt-0.5 text-[11px] leading-relaxed text-slate-500">Naik saat habit dikerjakan, turun saat occurrence terlewat</p>
                  </div>

                  {/* Timeframe Filter Toggle */}
                  <div className="flex shrink-0 items-center gap-0.5 self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:self-auto">
                    {(["7d", "1m", "3m"] as const).map(tf => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        aria-pressed={timeframe === tf}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
                          timeframe === tf ? "bg-white text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {tf === "7d" ? "7 Hari" : tf === "1m" ? "1 Bulan" : "3 Bulan"}
                      </button>
                    ))}
                  </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5" aria-label="Filter area transformasi">
                    <button type="button" onClick={() => setChartArea("all")} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${chartArea === "all" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>Semua area</button>
                    {selectedAreas.map(area => (
                      <button key={area} type="button" onClick={() => setChartArea(area)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${chartArea === area ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`} style={chartArea === area ? { backgroundColor: getTransformationAreaColor(area) } : undefined}>{area}</button>
                    ))}
                  </div>
                </div>

                {/* Line Chart Render */}
                {selectedAreas.length === 0 ? (
                  <div className="space-y-2 px-5 py-16 text-center">
                    <p className="text-xs text-slate-400">Belum ada area dipilih di PTP.</p>
                    <Link href="/journey">
                      <Button variant="outline" className="text-xs font-bold rounded-xl border-amber-400">Lengkapi PTP</Button>
                    </Link>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="px-5 py-16 text-center text-xs text-slate-400">Belum ada log habit pada rentang waktu ini.</div>
                ) : (
                  <div className="px-3 pb-2 pt-5 sm:px-5">
                    <div className="relative h-[220px] w-full px-2 pb-7 pt-2 sm:h-[250px]">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 720 180" preserveAspectRatio="none" role="img" aria-label="Grafik progres Action Plan per area transformasi">
                      {chartAxisValues.map((value, step) => {
                        const y = 16 + step * 36;
                        return (
                          <g key={`${value}-${step}`}>
                            <line x1="42" y1={y} x2="708" y2={y} stroke="#E2E8F0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <text x="34" y={y + 3} fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="end">{value}</text>
                          </g>
                        );
                      })}
                      <line x1="42" y1="16" x2="42" y2="160" stroke="#CBD5E1" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                      <line x1="42" y1={chartZeroY} x2="708" y2={chartZeroY} stroke="#94A3B8" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
                      {chartDayZeroIndex >= 0 && (
                        <g>
                          <line x1={42 + chartDayZeroIndex * (666 / Math.max(1, chartData.length - 1))} y1="16" x2={42 + chartDayZeroIndex * (666 / Math.max(1, chartData.length - 1))} y2="160" stroke="#D97706" strokeWidth="1" opacity="0.45" vectorEffect="non-scaling-stroke" />
                          <text x={42 + chartDayZeroIndex * (666 / Math.max(1, chartData.length - 1))} y="11" fill="#B45309" fontSize="8" fontWeight="700" textAnchor="middle">Hari 0</text>
                        </g>
                      )}
                      {visibleChartAreas.map((area) => {
                        const pts = chartData.map((row, i) => {
                          const score = row.scores[area];
                          return score === null || score === undefined ? null : {
                            x: chartData.length === 1 ? 375 : 42 + i * (666 / (chartData.length - 1)),
                            y: chartY(score),
                            score,
                            index: i,
                          };
                        });
                        const d = pts.reduce((path, point, index) => {
                          if (!point) return path;
                          return `${path}${!pts[index - 1] ? "M" : "L"} ${point.x} ${point.y} `;
                        }, "");
                        const color = getTransformationAreaColor(area);
                        return (
                          <g key={area}>
                            <path
                              d={d}
                              fill="none"
                              stroke={color}
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                            {pts.map(point => point && (
                              <circle key={point.index} cx={point.x} cy={point.y} r={2.5} fill="white" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke">
                                <title>{`${area} · ${chartData[point.index].programDay === null ? "Belum dimulai" : `Hari ${chartData[point.index].programDay}`} · ${chartData[point.index].day}: ${point.score} poin momentum`}</title>
                              </circle>
                            ))}
                          </g>
                        );
                      })}
                    </svg>
                    <div className="absolute inset-x-10 bottom-2 h-3 text-[9px] font-semibold tabular-nums text-slate-400">
                      {visibleChartLabels.map((row) => (
                        <span
                          key={`${row.day}-${row.index}`}
                          className="absolute -translate-x-1/2 whitespace-nowrap"
                          style={{ left: `${chartData.length === 1 ? 50 : (row.index / (chartData.length - 1)) * 100}%` }}
                        >
                          {row.day}
                        </span>
                      ))}
                    </div>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                  {visibleChartAreas.map(area => (
                    <div key={area} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: getTransformationAreaColor(area), boxShadow: `0 0 0 1px ${getTransformationAreaColor(area)}33` }} />
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
                        Grid Istiqamah 90 Hari
                      </h3>
                      <p className="ml-10 mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        Aktivitas Action Plan pada setiap tanggal
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-xl font-black leading-none tabular-nums text-navy-900">{activeIstiqamahDays}</span>
                      <span className="mt-1 block text-[10px] font-semibold text-slate-500">hari aktif</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-5 pb-4 pt-4">
                  <div>
                    <div className="mb-3 flex justify-end">
                      <span className="text-right text-[10px] font-semibold tabular-nums text-slate-500">{totalIstiqamahExecutions} total eksekusi</span>
                    </div>

                    <div className="grid grid-flow-col grid-rows-7 grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5" role="img" aria-label={`Grid istiqamah 90 hari, ${activeIstiqamahDays} hari aktif`}>
                      {heatmapData.map((item) => (
                        <span
                          key={item.date}
                          title={`${item.date}: ${item.count} eksekusi Action Plan`}
                          aria-label={`${item.date}: ${item.count} eksekusi Action Plan`}
                          className={`aspect-square w-full rounded-[3px] border transition-transform duration-200 hover:relative hover:z-10 hover:scale-125 ${
                            item.level === 4 ? "border-emerald-800 bg-emerald-700"
                            : item.level === 3 ? "border-emerald-700 bg-emerald-600"
                            : item.level === 2 ? "border-emerald-600 bg-emerald-500"
                            : item.level === 1 ? "border-emerald-300 bg-emerald-200"
                            : "border-slate-200 bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-500">
                    <span>Belum aktif</span>
                    <div className="flex items-center gap-1" aria-label="Intensitas istiqamah dari rendah ke tinggi">
                      <span className="mr-1">Rendah</span>
                      <span className="h-3 w-3 rounded-[3px] border border-slate-200 bg-slate-100" />
                      <span className="h-3 w-3 rounded-[3px] border border-emerald-300 bg-emerald-200" title="1-3 eksekusi" />
                      <span className="h-3 w-3 rounded-[3px] border border-emerald-600 bg-emerald-500" title="4-6 eksekusi" />
                      <span className="h-3 w-3 rounded-[3px] border border-emerald-700 bg-emerald-600" title="7-10 eksekusi" />
                      <span className="h-3 w-3 rounded-[3px] border border-emerald-800 bg-emerald-700" title=">10 eksekusi" />
                      <span className="ml-1">Tinggi</span>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* ─── 4. 3 AREA TRANSFORMATION CARDS (Border-free) ──────────────── */}
            <div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                    Area Transformasi & Pelaporan Bulanan
                  </h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {monthEditState === "ACTIVE"
                      ? `Pelaporan Bulan Ke-${selectedMonth} dapat diisi atau diedit sampai Hari ke-${monthGraceEndDay}.`
                      : monthEditState === "LOCKED_FUTURE"
                      ? `Pelaporan Bulan Ke-${selectedMonth} baru aktif mulai Hari ke-${monthStartDay}.`
                      : `Pelaporan Bulan Ke-${selectedMonth} telah terkunci sejak Hari ke-${monthGraceEndDay + 1}.`}
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  monthEditState === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}>
                  {monthEditState === "ACTIVE" ? <Edit3 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {monthEditState === "ACTIVE"
                    ? `Bulan ${selectedMonth} · Dapat diedit`
                    : monthEditState === "LOCKED_FUTURE"
                    ? `Bulan ${selectedMonth} · Belum aktif`
                    : `Bulan ${selectedMonth} · Terkunci`}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {selectedAreas.map(area => {
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
                            <span className={`text-xs font-extrabold min-w-0 truncate ${monthEditState === "ACTIVE" ? "text-navy-900" : "text-slate-600"}`}>{area}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              score === null
                                ? "bg-slate-100 text-slate-600"
                                : score >= 80 ? "bg-emerald-50 text-emerald-700"
                                : score >= 50 ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {score === null ? (rep?.indicators?.length ? "Belum Ada Data" : "Definisi Perlu Diperbaiki") : `${score}% Capaian`}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500"><p>Coverage struktur: {indicatorCoverage[area] || 0}%</p><p>Coverage pengukuran: {getMeasurementCoverage(rep)}%</p></div>

                          {rep?.targets?.mainTarget && (
                            <p className="text-xs text-slate-600 line-clamp-2 italic">
                              &ldquo;{rep.targets.mainTarget}&rdquo;
                            </p>
                          )}

                          {/* 4 Dimensi — hanya tampil jika targetnya memang diisi user di PTP */}
                          {(rep?.targets?.kualitas || rep?.targets?.kuantitas || rep?.targets?.waktu || rep?.targets?.biaya) ? (
                            <div className="space-y-1.5 pt-1 text-xs">
                              {rep?.targets?.kualitas && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Rating Target PTP</span>
                                  <span className="font-bold text-amber-700">{rep.targets.kualitas}</span>
                                </div>
                              )}
                              {rep?.targets?.kuantitas && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Realisasi Kuantitas</span>
                                  <span className="font-bold text-navy-900">{rep?.kuantitasActual || "Belum Diisi"}</span>
                                </div>
                              )}
                              {rep?.targets?.waktu && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Waktu Tepat Hari</span>
                                  <span className="font-bold text-navy-900">{rep?.waktuActualDays ? `${rep.waktuActualDays}/30 hari` : "Belum Diisi"}</span>
                                </div>
                              )}
                              {rep?.targets?.biaya && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Biaya / Anggaran</span>
                                  <span className="font-bold text-emerald-700">{rep?.biayaActual ? `Rp ${rep.biayaActual}` : "Belum Diisi"}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="pt-1 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Rating Evaluasi Mandiri</span>
                                <span className="font-bold text-amber-600 flex items-center gap-1">
                                  {rep?.kualitasRating ? <>{rep.kualitasRating}/5 <Star className="h-3 w-3 fill-amber-400 text-amber-400" /></> : "Belum Diisi"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {monthEditState === "ACTIVE" ? (
                          <Button
                            onClick={() => setEditingAreaModal(area)}
                            className="w-full bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-9 flex items-center justify-center gap-2 mt-2"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Input Capaian Bulanan
                          </Button>
                        ) : (
                          <Button
                            disabled
                            title={
                              monthEditState === "LOCKED_FUTURE"
                                ? `Aktif mulai Hari ke-${monthStartDay}`
                                : `Terkunci sejak Hari ke-${monthGraceEndDay + 1} (lewat masa tenggang 7 hari)`
                            }
                            className="mt-2 flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-100"
                          >
                            {monthEditState === "LOCKED_FUTURE" ? (
                              <><Hourglass className="h-3.5 w-3.5" /> Aktif di Hari ke-{monthStartDay}</>
                            ) : (
                              <><Lock className="h-3.5 w-3.5" /> Terkunci</>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── 5. CHECKPOINT TIMELINE & COACH THREAD (Border-free) ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-w-0 gap-2">
                  <h3 className="text-sm font-extrabold text-navy-900 flex items-center gap-2 min-w-0 truncate">
                    <MessageSquare className="h-4 w-4 text-navy-900 shrink-0" />
                    Feedback & Catatan Evaluasi (Bulan {selectedMonth})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium shrink-0">
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
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Catatan checkpoint Bulan Ke-{selectedMonth}</label>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
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
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          status === "ON_TRACK" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        On Track
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus("NEED_SUPPORT")}
                        disabled={monthEditState !== "ACTIVE"}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          status === "NEED_SUPPORT" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        Need Support
                      </button>
                    </div>
                  </div>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    disabled={monthEditState !== "ACTIVE"}
                    placeholder="Tuliskan kendala atau keberhasilan Anda bulan ini..."
                    className="text-xs border-slate-200 focus:border-amber-400 rounded-xl resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-100"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving || monthEditState !== "ACTIVE"} className="h-10 w-full rounded-xl bg-[#071A33] px-5 text-xs font-bold text-amber-300 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto">
                      {monthEditState !== "ACTIVE" ? <><Lock className="mr-1.5 h-3.5 w-3.5" /> Tidak dapat diedit</> : saving ? "Menyimpan..." : saved ? "Tersimpan" : "Simpan catatan checkpoint"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 6. REFLEKSI AKHIR 90 HARI (Border-free) ────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6 ${finalReflectionUnlocked ? "border-slate-200/80 bg-white" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${finalReflectionUnlocked ? "bg-amber-50 text-amber-700" : "bg-slate-200 text-slate-500"}`}>
                    {finalReflectionUnlocked ? <BookOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-navy-900 sm:text-base">Refleksi akhir program</h3>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                      {finalReflectionUnlocked
                        ? "Rangkum pembelajaran utama, perubahan nyata, dan komitmen setelah perjalanan 90 hari."
                        : "Bagian ini dibuka menjelang akhir perjalanan agar refleksi merangkum proses secara utuh."}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${finalReflectionUnlocked ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {finalReflectionUnlocked ? "Terbuka" : `Terbuka Hari ke-89 · ${Math.max(0, 89 - dayCount)} hari lagi`}
                </span>
              </div>
              <Textarea
                rows={4}
                value={finalReflection}
                onChange={e => setFinalReflection(e.target.value)}
                disabled={!finalReflectionUnlocked}
                maxLength={3000}
                placeholder="Tuliskan refleksi & komitmen keberlanjutan Anda..."
                className="mt-4 min-h-[140px] resize-none rounded-xl border-slate-200 text-xs leading-relaxed focus:border-amber-400 disabled:bg-white/60 disabled:text-slate-400 disabled:opacity-100"
              />
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[10px] font-medium text-slate-400">{finalReflection.length}/3000 karakter</span>
                <Button
                  onClick={handleSaveReflection}
                  disabled={savingReflection || !journeyId || !finalReflectionUnlocked || !finalReflection.trim()}
                  className="h-10 w-full rounded-xl bg-[#071A33] px-5 text-xs font-bold text-amber-300 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
                >
                  {!finalReflectionUnlocked ? <><Lock className="mr-1.5 h-3.5 w-3.5" /> Belum tersedia</> : savingReflection ? "Menyimpan..." : savedReflection ? "Tersimpan" : "Simpan refleksi akhir"}
                </Button>
              </div>
            </div>

          </div>

          {/* ─── RIGHT SIDEBAR COLUMN (Border-free, Solid Green for Top Area) ─── */}
          <div className="w-full xl:w-96 shrink-0 space-y-6">

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
                    <p className="font-bold flex items-center gap-1.5 text-white min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                      <span className="truncate">Area Terbaik: {healthData.highestArea}</span>
                    </p>
                    <p className="text-emerald-50 text-[11px] leading-relaxed">
                      Skor capaian mencapai <strong>{healthData.areas[healthData.highestArea]}%</strong>. Pertahankan ritme istiqamah ini.
                    </p>
                  </div>
                ) : null}

                {healthData.lowestArea && healthData.lowestArea !== healthData.highestArea ? (
                  <div className="bg-amber-50 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">Fokus Perhatian: {healthData.lowestArea}</span>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Konsistensi</span>
                <p className="text-xs text-slate-500">Estimasi berbasis aktivitas real</p>
              </div>
              <div className="relative py-1">
                <span className="text-3xl font-black text-navy-900">
                  {projectedOverallPct === null ? "--" : `${projectedOverallPct}%`}
                </span>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  {projectedOverallPct === null
                    ? "Belum cukup data"
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
                    4 Aspek Pengukuran
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
            {/* Mobile: bottom-sheet menempel di bawah layar, tinggi maks 90vh + scroll.
                Desktop (sm ke atas): kembali ke dialog di tengah seperti semula. */}
            <DialogContent
              className="left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0 w-full max-w-full
                         rounded-t-3xl rounded-b-none max-h-[90vh] overflow-y-auto
                         sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                         sm:max-w-xl sm:rounded-2xl sm:max-h-[85vh]
                         bg-white border border-slate-200 shadow-2xl p-5 sm:p-6"
            >
              {/* Drag handle indicator khusus mobile */}
              <div className="sm:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />

              <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="text-base font-black text-navy-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600 shrink-0" />
                  <span className="truncate">Pelaporan Indikator: {editingAreaModal}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Input realisasi bulan ke-{selectedMonth}. Skor keberhasilan dihitung otomatis.
                </DialogDescription>
              </DialogHeader>

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
                            Input untuk Bulan Ke-{selectedMonth} baru aktif mulai <b>Hari ke-{monthStartDay}</b>.
                          </p>
                        </>
                      ) : (
                        <>
                          <Lock className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="text-sm text-slate-600">
                            Masa input Bulan Ke-{selectedMonth} sudah berakhir (masa tenggang 7 hari terlewati sejak Hari ke-{monthGraceEndDay}). Data tidak bisa diedit lagi.
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
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Sasaran Target PTP Anda:</span>
                        <p className="text-xs font-medium text-navy-900 italic leading-relaxed">&ldquo;{rep.targets.mainTarget}&rdquo;</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Skor Capaian Area:</span>
                       <span className="text-sm font-extrabold text-emerald-600">{overallPct === null ? "Belum Ada Data" : `${overallPct}% Berhasil`}</span>
                    </div>

                     {rep.indicators?.length ? (
                       <div className="space-y-3">
                         {rep.indicators.filter(indicator => indicator.active).map(indicator => (
                           <div key={indicator.key} className="rounded-xl border border-slate-200 bg-white p-3">
                             <div className="mb-2 flex items-center justify-between gap-2"><label className="text-xs font-bold text-slate-700">{indicator.label}</label><span className="text-[10px] text-slate-500">Target {indicator.target} {indicator.unit}</span></div>
                             <Input type="number" value={rep.indicatorActuals?.[indicator.key] ?? ""} onChange={event => {
                                const value = event.target.value === "" ? undefined : Number(event.target.value);
                                if (value !== undefined && (!Number.isFinite(value) || value < 0)) return;
                                setAreaReports(current => ({ ...current, [selectedMonth]: { ...current[selectedMonth], [editingAreaModal]: { ...current[selectedMonth][editingAreaModal], indicatorActuals: { ...current[selectedMonth][editingAreaModal].indicatorActuals, [indicator.key]: value } } } }));
                              }} min={0} placeholder={`Aktual (${indicator.unit || "angka"})`} className="h-9 text-xs" />
                              <p className="mt-2 text-[10px] text-slate-500">{indicator.type === "quality" ? "Kualitas" : indicator.type === "quantity" ? "Kuantitas" : indicator.type === "time" ? "Waktu" : "Efisiensi/Biaya"} · Kondisi saat ini {indicator.baseline} · Target 90 hari {indicator.target} · {indicator.direction === "higher_is_better" ? "Naik lebih baik" : "Turun lebih baik"} · {indicator.unit || "Satuan belum tersedia"}</p>
                              <Input value={rep.indicatorEvidenceNotes?.[indicator.key] || ""} onChange={event => setAreaReports(current => ({ ...current, [selectedMonth]: { ...current[selectedMonth], [editingAreaModal]: { ...current[selectedMonth][editingAreaModal], indicatorEvidenceNotes: { ...current[selectedMonth][editingAreaModal].indicatorEvidenceNotes, [indicator.key]: event.target.value } } } }))} placeholder="Catatan bukti (opsional)" className="mt-2 h-9 text-xs" />
                           </div>
                         ))}
                       </div>
                     ) : !rep.targets.kualitas && !rep.targets.kuantitas && !rep.targets.waktu && !rep.targets.biaya ? (
                      <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-amber-900 text-xs block">Rating Capaian Bulanan (1 – 5 Bintang)</label>
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                             {rep.kualitasRating ? `${rep.kualitasRating}/5 ★ (${rep.kualitasRating * 20}% Capaian)` : "Belum Diisi"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Berikan penilaian mandiri atas kualitas keberhasilan & pencapaian Anda pada area ini di Bulan Ke-{selectedMonth}.
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
                          <p className="text-[10px] text-slate-500">Target PTP: {rep.targets.kualitas || "Khusyu & Tepat waktu"}</p>
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
                          <p className="text-[10px] text-slate-500">Target PTP: {rep.targets.kuantitas || "Target PTP"}</p>
                          <div className="space-y-1.5">
                            <Input
                              value={rep.kuantitasActual}
                              onChange={e => updateAreaReport(editingAreaModal, "kuantitasActual", e.target.value)}
                              placeholder="Realisasi bulan ini (misal: 95)"
                              className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>}

                        {/* 3. Waktu */}
                        {rep.targets.waktu && <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-2">
                          <label className="font-bold text-amber-800 block">3. Waktu (Hari Tepat Waktu)</label>
                          <p className="text-[10px] text-slate-500">Target PTP: {rep.targets.waktu || "Jadwal Tepat Waktu"}</p>
                          <Input
                            type="number" min={0} max={30}
                            value={rep.waktuActualDays}
                            onChange={e => updateAreaReport(editingAreaModal, "waktuActualDays", e.target.value)}
                            placeholder="Hari tepat waktu dari 30 (misal: 25)"
                            className="text-xs h-8 border-slate-200 rounded-lg bg-white"
                          />
                        </div>}

                        {/* 4. Biaya */}
                        {rep.targets.biaya && <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                          <label className="font-bold text-emerald-800 block">4. Biaya / Anggaran (Nominal)</label>
                          <p className="text-[10px] text-slate-500">Target PTP: {rep.targets.biaya || "Nominal Rp"}</p>
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
