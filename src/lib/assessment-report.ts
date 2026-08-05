export type AssessmentMetric = {
  score: number | null;
  numerator: number;
  denominator: number;
  coverage?: number;
  indicator_coverage?: number;
  measurement_coverage?: number;
};

export type EngagementComponents = {
  baseline: boolean;
  ptp: boolean;
  checkpoint: boolean | { met: boolean; numerator?: number; denominator?: number; coverage?: number | null };
  journal: boolean | { met: boolean; journal_days?: number; total_days?: number; consistency?: number | null };
  tracking: boolean;
};

export type CoachAssessment = {
  coach_score: number | null;
  validated_outcome: number | null;
  validation_status: string;
} | null;

export type ParticipantAssessment = {
  user_id: string;
  journey_id: string | null;
  methodology_version: string;
  indicators?: unknown[];
  baseline?: { completed: boolean; score: number | null; areas: { area: string; score: number }[] };
  metrics: {
    outcome: AssessmentMetric;
    execution: AssessmentMetric;
    engagement: EngagementComponents;
    peer_support: AssessmentMetric;
    coach_assessment: CoachAssessment;
  };
};

export type GroupImpactReport = {
  methodology_version: string;
  participants: ParticipantAssessment[];
};

export type GroupMetric = AssessmentMetric & { measured: number };

export function summarizeGroupImpact(report: GroupImpactReport) {
  const participants = report.participants ?? [];
  const metric = (select: (row: ParticipantAssessment) => AssessmentMetric): GroupMetric => {
    const measured = participants.map(select).filter((item) => item.score !== null);
    return {
      score: measured.length ? Math.round(measured.reduce((sum, item) => sum + (item.score ?? 0), 0) / measured.length) : null,
      numerator: measured.reduce((sum, item) => sum + Number(item.numerator || 0), 0),
      denominator: measured.reduce((sum, item) => sum + Number(item.denominator || 0), 0),
      measured: measured.length,
      coverage: participants.length ? Math.round(measured.length / participants.length * 100) : 0,
    };
  };
  const component = (key: keyof EngagementComponents) => {
    const numerator = participants.filter((row) => {
      const value = row.metrics.engagement[key];
      return typeof value === "boolean" ? value : value?.met === true;
    }).length;
    return { numerator, denominator: participants.length, coverage: participants.length ? Math.round(numerator / participants.length * 100) : 0 };
  };
  const assessed = participants.filter((row) => row.metrics.coach_assessment?.coach_score != null);
  const validated = participants.filter((row) => row.metrics.coach_assessment?.validated_outcome != null);
  const baselineScores = participants.map((row) => row.baseline?.score).filter((score): score is number => typeof score === "number");

  return {
    participantCount: participants.length,
    outcome: metric((row) => row.metrics.outcome),
    execution: metric((row) => row.metrics.execution),
    peerSupport: metric((row) => row.metrics.peer_support),
    baseline: {
      score: baselineScores.length ? Math.round(baselineScores.reduce((sum, score) => sum + score, 0) / baselineScores.length) : null,
      measured: baselineScores.length, denominator: participants.length,
      coverage: participants.length ? Math.round(baselineScores.length / participants.length * 100) : 0,
    },
    engagement: {
      baseline: component("baseline"), ptp: component("ptp"), checkpoint: component("checkpoint"),
      journal: component("journal"), tracking: component("tracking"),
    },
    coachAssessment: {
      score: assessed.length ? Math.round(assessed.reduce((sum, row) => sum + Number(row.metrics.coach_assessment?.coach_score), 0) / assessed.length) : null,
      measured: assessed.length, denominator: participants.length,
      coverage: participants.length ? Math.round(assessed.length / participants.length * 100) : 0,
    },
    validatedOutcome: {
      score: validated.length ? Math.round(validated.reduce((sum, row) => sum + Number(row.metrics.coach_assessment?.validated_outcome), 0) / validated.length) : null,
      measured: validated.length, denominator: participants.length,
      coverage: participants.length ? Math.round(validated.length / participants.length * 100) : 0,
    },
  };
}

export function isAssessmentMigrationMissing(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return text.includes("pgrst202") || text.includes("get_admin_group_impact") || text.includes("schema cache");
}
