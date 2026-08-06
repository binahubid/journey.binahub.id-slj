import { createClient } from "@/lib/supabase/client";
import { coachParticipants, type CoachParticipant } from "@/lib/coach-mock-data";

export type CoachDataMode = "live" | "preview";
export type CoachViewer = { name: string; role: "coach" | "admin" };

export type CoachPortalParticipant = CoachParticipant & {
  participantUserId: string;
  journeyId: string | null;
  participantOutcome: number | null;
  indicators: CoachIndicator[];
  areaMetrics: CoachAreaMetric[];
  methodologyVersion: string;
};

export type CoachIndicator = {
  key: string;
  area: string;
  type: "quality" | "quantity" | "time" | "cost";
  label: string;
  baseline: number | null;
  target: number | null;
  direction: "higher_is_better" | "lower_is_better";
  unit: string;
  active: boolean;
  actualSource: "action_plan" | "self_report" | "external" | "coach";
  qualityRubric: Record<number, string> | null;
  linkedActionPlanIds: string[];
  actuals: { month: number; actual: number; evidenceNote: string }[];
};

export type CoachAreaMetric = {
  area: string;
  outcome: number | null;
  execution: number | null;
  indicatorCoverage: number | null;
  measurementCoverage: number | null;
  activeIndicators: number | null;
  measuredIndicators: number | null;
  actionPlans: number | null;
};

export type CoachAssessment = {
  participantOutcome: number | null;
  coachScore: number | null;
  validatedOutcome: number | null;
  validationStatus: string;
  evidenceNote: string;
  scores: number[];
};

export type CoachPortalResult<T> = {
  data: T;
  mode: CoachDataMode;
  viewer: CoachViewer;
  previewReason?: string;
};

type JsonRecord = Record<string, any>;

const unavailableCodes = new Set(["42883", "42P01", "PGRST202", "PGRST205"]);

function isRpcUnavailable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return unavailableCodes.has(error.code || "") || /schema cache|function .* does not exist/i.test(error.message || "");
}

function firstRecord(value: unknown): JsonRecord {
  if (Array.isArray(value)) return (value[0] || {}) as JsonRecord;
  return (value || {}) as JsonRecord;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";
}

function normalizeIndicators(input: JsonRecord): CoachIndicator[] {
  const rows = input.indicators ?? input.ptp_indicators ?? input.indicator_data ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map((row: JsonRecord) => {
    const actualRows = row.actuals ?? row.monthly_actuals ?? row.indicator_actuals ?? [];
    const source = row.actual_source ?? row.actualSource ?? "self_report";
    const rubric = row.quality_rubric ?? row.qualityRubric;
    const linked = row.linked_action_plan_ids ?? row.linkedActionPlanIds ?? [];
    return {
      key: text(row.key ?? row.indicator_key ?? row.id),
      area: text(row.area),
      type: text(row.type ?? row.indicator_type, "quantity") as CoachIndicator["type"],
      label: text(row.label ?? row.name, "Indikator"),
      baseline: nullableNumber(row.baseline ?? row.baseline_value),
      target: nullableNumber(row.target ?? row.target_value),
      direction: text(row.direction, "higher_is_better") as CoachIndicator["direction"],
      unit: text(row.unit),
      active: Boolean(row.active ?? true),
      actualSource: ["action_plan", "self_report", "external", "coach"].includes(source) ? source : "self_report",
      qualityRubric: rubric && typeof rubric === "object" ? rubric : null,
      linkedActionPlanIds: Array.isArray(linked) ? linked.map(String) : [],
      actuals: Array.isArray(actualRows) ? actualRows.flatMap((actual: JsonRecord) => {
        const value = nullableNumber(actual.actual ?? actual.actual_value);
        return value !== null && value >= 0 ? [{ month: number(actual.month ?? actual.month_number), actual: value, evidenceNote: text(actual.evidence_note ?? actual.evidenceNote) }] : [];
      }) : [],
    };
  });
}

function normalizeAreaMetrics(input: JsonRecord): CoachAreaMetric[] {
  const rows = input.area_metrics ?? input.per_area ?? input.metrics?.per_area ?? input.metrics?.areas ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map((row: JsonRecord) => {
    const outcome = row.outcome || {};
    const execution = row.execution || {};
    const indicatorCoverage = row.indicator_coverage || row.indicatorCoverage || {};
    const measurementCoverage = row.measurement_coverage || row.measurementCoverage || {};
    return {
      area: text(row.area ?? row.name),
      outcome: nullableNumber(outcome.score ?? row.outcome_score ?? row.outcome),
      execution: nullableNumber(execution.score ?? row.execution_score ?? row.execution),
      indicatorCoverage: nullableNumber(indicatorCoverage.score ?? indicatorCoverage.coverage ?? row.indicator_coverage),
      measurementCoverage: nullableNumber(measurementCoverage.score ?? measurementCoverage.coverage ?? row.measurement_coverage),
      activeIndicators: nullableNumber(indicatorCoverage.numerator ?? row.active_indicators),
      measuredIndicators: nullableNumber(measurementCoverage.numerator ?? row.measured_indicators),
      actionPlans: nullableNumber(execution.action_plans ?? row.action_plans),
    };
  });
}

function normalizeParticipant(input: JsonRecord): CoachPortalParticipant {
  const profile = input.profile || input.participant || {};
  const journey = input.journey || {};
  const name = text(input.full_name ?? input.fullName ?? profile.full_name ?? profile.fullName, "Peserta");
  const participantUserId = text(input.participant_user_id ?? input.user_id ?? profile.user_id ?? input.id);
  const status = text(input.journey_status ?? input.journeyStatus ?? journey.status, "ACTIVE") as CoachParticipant["journeyStatus"];
  const checkpoints = (input.checkpoints || input.monthly_reviews || []) as CoachParticipant["checkpoints"];
  const latestCheckpoint = checkpoints[checkpoints.length - 1];
  const baseline = (input.baseline || input.baseline_scores || {}) as Record<string, number>;

  return {
    id: participantUserId,
    participantUserId,
    journeyId: text(input.journey_id ?? journey.id) || null,
    participantOutcome: nullableNumber(input.participant_outcome ?? input.participantOutcome),
    indicators: normalizeIndicators(input),
    areaMetrics: normalizeAreaMetrics(input),
    methodologyVersion: text(input.methodology_version ?? input.metrics?.methodology_version, "1.0"),
    fullName: name,
    initials: text(input.initials, initials(name)),
    company: text(input.company_name ?? input.company ?? profile.company_name, "-"),
    batch: text(input.batch_name ?? input.batch ?? profile.batch_name, "-"),
    city: text(input.city ?? input.location ?? profile.location, "-"),
    dayCount: number(input.day_count ?? input.dayCount),
    journeyStatus: status,
    habitCompletionPercent: number(input.habit_completion_percent ?? input.habitCompletionPercent),
    streak: number(input.streak),
    lastActive: text(input.last_active_label ?? input.lastActive, "Belum tersedia"),
    lastActiveDaysAgo: number(input.last_active_days_ago ?? input.lastActiveDaysAgo),
    lastHabitLogDaysAgo: number(input.last_habit_log_days_ago ?? input.lastHabitLogDaysAgo),
    checkpointOpenDaysAgo: nullableNumber(input.checkpoint_open_days_ago ?? input.checkpointOpenDaysAgo) ?? undefined,
    lastCheckpointStatus: (input.last_checkpoint_status ?? input.lastCheckpointStatus ?? latestCheckpoint?.status ?? "NOT_FILLED") as CoachParticipant["lastCheckpointStatus"],
    coachRepliedDaysAgo: nullableNumber(input.coach_replied_days_ago ?? input.coachRepliedDaysAgo) ?? undefined,
    muhasabah: text(input.muhasabah ?? journey.muhasabah),
    niat: text(input.niat ?? journey.niat),
    mainTarget: (() => {
      const value = input.main_target ?? input.mainTarget ?? journey.main_target;
      if (typeof value !== "string") return "";
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") return Object.values(parsed).map((item: any) => text(item?.mainTarget ?? item?.target)).filter(Boolean).join("; ");
      } catch {}
      return value;
    })(),
    transformationAreas: (input.transformation_areas ?? input.area_transformasi ?? journey.area_transformasi ?? []) as string[],
    successIndicators: (input.success_indicators ?? journey.success_indicators ?? []) as string[],
    baseline,
    habitTrend: (input.habit_trend ?? input.habitTrend ?? []) as number[],
    journals: (input.journals ?? []) as CoachParticipant["journals"],
    indicatorReports: (input.indicator_reports ?? input.monthly_indicator_reports ?? []) as CoachParticipant["indicatorReports"],
    managerEvaluations: (input.manager_evaluations ?? []) as CoachParticipant["managerEvaluations"],
    checkpoints,
    ptpSnapshots: (input.ptp_snapshots ?? []) as CoachParticipant["ptpSnapshots"],
  };
}

async function getViewer() {
  const supabase = createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sesi coach tidak tersedia. Silakan masuk kembali.");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("full_name, role").eq("user_id", auth.user.id).maybeSingle();
  if (profileError) throw profileError;
  const role = (profile?.role || auth.user.app_metadata?.role) as string;
  if (role !== "coach" && role !== "admin") throw new Error("Akun ini tidak memiliki akses Coach Portal.");
  return { supabase, viewer: { name: profile?.full_name || auth.user.email || "Coach", role } as CoachViewer };
}

function previewParticipants(): CoachPortalParticipant[] {
  return coachParticipants.map((participant) => ({ ...participant, participantUserId: participant.id, journeyId: null, participantOutcome: null, indicators: [], areaMetrics: [], methodologyVersion: "1.0" }));
}

export async function loadCoachParticipants(): Promise<CoachPortalResult<CoachPortalParticipant[]>> {
  const { supabase, viewer } = await getViewer();
  const { data, error } = await supabase.rpc("get_coach_participants" as never);
  if (error) {
    if (!isRpcUnavailable(error)) throw error;
    return { data: previewParticipants(), mode: "preview", viewer, previewReason: "RPC data coach belum tersedia pada environment ini." };
  }
  const rows = Array.isArray(data) ? data : firstRecord(data).participants || [];
  return { data: rows.map((row: JsonRecord) => normalizeParticipant(row)), mode: "live", viewer };
}

export async function loadParticipantAssessment(participantUserId: string): Promise<CoachPortalResult<{ participant: CoachPortalParticipant; assessment: CoachAssessment }>> {
  const { supabase, viewer } = await getViewer();
  const { data, error } = await supabase.rpc("get_participant_assessment" as never, { p_participant_user_id: participantUserId } as never);
  if (error) {
    if (!isRpcUnavailable(error)) throw error;
    const mock = coachParticipants.find((participant) => participant.id === participantUserId);
    if (!mock) throw new Error("Peserta tidak ditemukan dalam preview.");
    return {
      data: {
        participant: { ...mock, participantUserId: mock.id, journeyId: null, participantOutcome: null, indicators: [], areaMetrics: [], methodologyVersion: "1.0" },
        assessment: { participantOutcome: null, coachScore: null, validatedOutcome: null, validationStatus: "BELUM_DITINJAU", evidenceNote: "", scores: [3, 3, 3, 3] },
      },
      mode: "preview",
      viewer,
      previewReason: "RPC assessment belum tersedia pada environment ini. Nilai preview tidak dapat disimpan.",
    };
  }

  const payload = firstRecord(data);
  const metrics = payload.metrics || {};
  const outcomeMetric = metrics.outcome || {};
  const assessmentRow = payload.assessment || payload.coach_assessment || metrics.coach_assessment || {};
  const rawScores = payload.rubric_scores || assessmentRow.rubric_scores || assessmentRow.scores || [];
  const scores = ["evidence", "consistency", "target", "sustainability"].map((key, index) => {
    if (Array.isArray(rawScores)) return number(rawScores.find((item: JsonRecord) => item.rubric_key === key)?.score ?? rawScores[index]?.score, 3);
    return number(rawScores[key], 3);
  });
  const participant = normalizeParticipant({ ...(payload.participant || payload), ...(payload.journey ? { journey: payload.journey } : {}), indicators: payload.indicators ?? payload.ptp_indicators, area_metrics: payload.area_metrics ?? payload.per_area ?? metrics.per_area ?? metrics.areas, metrics, methodology_version: payload.methodology_version });
  participant.participantOutcome = nullableNumber(payload.participant_outcome ?? outcomeMetric.score ?? assessmentRow.participant_outcome ?? participant.participantOutcome);
  return {
    data: {
      participant,
      assessment: {
        participantOutcome: participant.participantOutcome,
        coachScore: nullableNumber(assessmentRow.coach_score),
        validatedOutcome: nullableNumber(assessmentRow.validated_outcome),
        validationStatus: text(assessmentRow.validation_status, "BELUM_DITINJAU"),
        evidenceNote: text(assessmentRow.evidence_note),
        scores,
      },
    },
    mode: "live",
    viewer,
  };
}

export async function saveCoachAssessment(input: { participantUserId: string; journeyId: string; participantOutcome: number; validationStatus: string; evidenceNote: string; scores: number[] }) {
  const { supabase, viewer } = await getViewer();
  if (viewer.role === "admin") throw new Error("Admin memiliki akses inspeksi saja. Assessment hanya dapat disimpan oleh coach yang ditugaskan.");
  const keys = ["evidence", "consistency", "target", "sustainability"];
  const weights = [30, 30, 25, 15];
  const { data, error } = await supabase.rpc("save_coach_assessment" as never, {
    p_participant_user_id: input.participantUserId,
    p_journey_id: input.journeyId,
    p_participant_outcome: input.participantOutcome,
    p_validation_status: input.validationStatus,
    p_evidence_note: input.evidenceNote,
    p_scores: input.scores.map((score, index) => ({ key: keys[index], score, weight: weights[index] })),
  } as never);
  if (error) throw error;
  return firstRecord(data);
}
