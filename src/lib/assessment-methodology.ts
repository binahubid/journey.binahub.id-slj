export const METHODOLOGY_VERSION = "1.0";

export type IndicatorDirection = "higher_is_better" | "lower_is_better";
export type IndicatorType = "quality" | "quantity" | "time" | "cost";

export const indicatorTypes: { key: IndicatorType; label: string; description: string; example: string; defaultDirection: IndicatorDirection; unitExample: string }[] = [
  { key: "quality", label: "Kualitas", description: "Mutu atau tingkat kualitas hasil/perilaku.", example: "Skor kekhusyukan sholat", defaultDirection: "higher_is_better", unitExample: "skor 1-10" },
  { key: "quantity", label: "Kuantitas", description: "Jumlah, frekuensi, atau volume yang dicapai.", example: "Jumlah sholat berjamaah per minggu", defaultDirection: "higher_is_better", unitExample: "kali" },
  { key: "time", label: "Waktu", description: "Durasi, kecepatan, atau ketepatan waktu.", example: "Rata-rata keterlambatan menyelesaikan tugas", defaultDirection: "lower_is_better", unitExample: "menit / hari" },
  { key: "cost", label: "Efisiensi/Biaya", description: "Nominal biaya, penghematan, atau efisiensi sumber daya.", example: "Biaya operasional bulanan", defaultDirection: "lower_is_better", unitExample: "Rp" },
];

export type IndicatorDefinition = {
  key: string;
  type: IndicatorType;
  label: string;
  active: boolean;
  direction: IndicatorDirection;
  baseline: number;
  target: number;
  unit?: string;
};

export type IndicatorValidationError = {
  code: "indicator_count" | "duplicate_type" | "required_label" | "required_unit" | "invalid_baseline" | "invalid_target" | "equal_baseline_target";
  area: string;
  indicatorKey?: string;
  message: string;
};

export type IndicatorValidationResult = {
  valid: boolean;
  errors: IndicatorValidationError[];
};

export type AssessmentMetric = {
  score: number | null;
  numerator?: number;
  denominator?: number;
  measuredCount: number;
  excludedCount: number;
  methodologyVersion: string;
};

const metric = (score: number | null, measuredCount: number, excludedCount = 0, extra: Pick<AssessmentMetric, "numerator" | "denominator"> = {}): AssessmentMetric => ({
  score: score === null ? null : Math.max(0, Math.min(100, Math.round(score))),
  measuredCount,
  excludedCount,
  methodologyVersion: METHODOLOGY_VERSION,
  ...extra,
});

export const assessmentDimensions = [
  { key: "outcome", label: "Outcome Attainment", description: "Pencapaian target berdasarkan 1-4 indikator aktif peserta." },
  { key: "execution", label: "Behavior Execution", description: "Konsistensi action plan berdasarkan habit yang benar-benar dijadwalkan." },
  { key: "engagement", label: "Program Engagement", description: "Partisipasi dalam baseline, PTP, checkpoint, journal, dan tracking." },
  { key: "support", label: "Peer Support", description: "Konsistensi dukungan Sahabat Safar per minggu, bukan jumlah klik." },
  { key: "validation", label: "Validation Strength", description: "Kekuatan hasil berdasarkan penilaian peserta, coach, dan nantinya atasan." },
] as const;

export const coachAssessmentRubric = [
  { label: "Kesesuaian bukti", weight: 30, description: "Bukti mendukung capaian yang dilaporkan peserta." },
  { label: "Konsistensi perilaku", weight: 30, description: "Perubahan konsisten dengan habit dan checkpoint." },
  { label: "Pencapaian target", weight: 25, description: "Perubahan berkaitan langsung dengan target PTP." },
  { label: "Keberlanjutan", weight: 15, description: "Perubahan berpotensi bertahan setelah program." },
] as const;

export function calculateValidatedOutcome(participantOutcome: number, coachAssessment: number) {
  return Math.round(participantOutcome * 0.6 + coachAssessment * 0.4);
}

export function calculateCoachAssessment(scores: number[]) {
  if (scores.length !== coachAssessmentRubric.length) {
    throw new Error(`Coach Assessment membutuhkan tepat ${coachAssessmentRubric.length} skor rubrik.`);
  }
  if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
    throw new RangeError("Setiap skor rubrik Coach Assessment harus berupa bilangan bulat 1-5.");
  }
  return Math.round(scores.reduce((total, score, index) => total + (score / 5) * 100 * (coachAssessmentRubric[index].weight / 100), 0));
}

export function validateAreaIndicators(indicators: IndicatorDefinition[], area = "Area Transformasi"): IndicatorValidationResult {
  const activeIndicators = indicators.filter((indicator) => indicator.active);
  const errors: IndicatorValidationError[] = [];

  if (activeIndicators.length < 1 || activeIndicators.length > 4) {
    errors.push({ code: "indicator_count", area, message: `${area}: harus memiliki 1-4 indikator aktif.` });
  }

  const usedTypes = new Set<IndicatorType>();
  activeIndicators.forEach((indicator) => {
    const context = `${area} - ${indicator.label.trim() || indicator.type}`;
    if (usedTypes.has(indicator.type)) {
      errors.push({ code: "duplicate_type", area, indicatorKey: indicator.key, message: `${context}: jenis indikator tidak boleh duplikat dalam area yang sama.` });
    }
    usedTypes.add(indicator.type);

    if (!indicator.label.trim()) {
      errors.push({ code: "required_label", area, indicatorKey: indicator.key, message: `${area} - ${indicator.type}: nama indikator wajib diisi.` });
    }
    if (!indicator.unit?.trim()) {
      errors.push({ code: "required_unit", area, indicatorKey: indicator.key, message: `${context}: satuan wajib diisi.` });
    }
    if (!Number.isFinite(indicator.baseline) || indicator.baseline < 0) {
      errors.push({ code: "invalid_baseline", area, indicatorKey: indicator.key, message: `${context}: kondisi saat ini harus berupa angka valid dan tidak negatif.` });
    }
    if (!Number.isFinite(indicator.target) || indicator.target < 0) {
      errors.push({ code: "invalid_target", area, indicatorKey: indicator.key, message: `${context}: target 90 hari harus berupa angka valid dan tidak negatif.` });
    }
    if (Number.isFinite(indicator.baseline) && Number.isFinite(indicator.target) && indicator.baseline === indicator.target) {
      errors.push({ code: "equal_baseline_target", area, indicatorKey: indicator.key, message: `${context}: kondisi saat ini dan target 90 hari tidak boleh sama.` });
    }
  });

  return { valid: errors.length === 0, errors };
}

export function calculateIndicatorOutcome(input: {
  baseline: number;
  target: number;
  actual: number;
  direction: IndicatorDirection;
}): AssessmentMetric {
  const { baseline, target, actual, direction } = input;
  const denominator = Math.abs(target - baseline);
  if (![baseline, target, actual].every(Number.isFinite) || denominator === 0) return metric(null, 0, 1, { denominator });
  const numerator = direction === "higher_is_better" ? actual - baseline : baseline - actual;
  return metric((numerator / (direction === "higher_is_better" ? target - baseline : baseline - target)) * 100, 1, 0, { numerator, denominator });
}

export function calculateIndicatorOutcomes(indicators: IndicatorDefinition[], actuals: Record<string, number | undefined>) {
  return indicators.filter((indicator) => indicator.active).map((indicator) => ({
    key: indicator.key,
    label: indicator.label,
    ...calculateIndicatorOutcome({ ...indicator, actual: actuals[indicator.key] ?? Number.NaN }),
  }));
}

export function calculateIndicatorCoverage(activeIndicatorCount: number, maxIndicators = 4): AssessmentMetric {
  const maximum = Number.isFinite(maxIndicators) ? Math.max(0, Math.floor(maxIndicators)) : 0;
  const active = Number.isFinite(activeIndicatorCount) ? Math.max(0, Math.min(maximum, Math.floor(activeIndicatorCount))) : 0;
  return metric(maximum > 0 ? active / maximum * 100 : null, active, Math.max(0, maximum - active), { numerator: active, denominator: maximum });
}

export function calculateMeasurementCoverage(measuredIndicatorCount: number, activeIndicatorCount: number): AssessmentMetric {
  const active = Number.isFinite(activeIndicatorCount) ? Math.max(0, Math.floor(activeIndicatorCount)) : 0;
  const measured = Number.isFinite(measuredIndicatorCount) ? Math.max(0, Math.min(active, Math.floor(measuredIndicatorCount))) : 0;
  return metric(active > 0 ? measured / active * 100 : null, measured, active - measured, { numerator: measured, denominator: active });
}

export function calculateAreaOutcome(indicators: AssessmentMetric[]): AssessmentMetric {
  const measured = indicators.filter((indicator) => indicator.score !== null);
  if (!measured.length) return metric(null, 0, indicators.length);
  return metric(measured.reduce((total, indicator) => total + (indicator.score || 0), 0) / measured.length, measured.length, indicators.length - measured.length);
}

export function calculateParticipantOutcome(areas: AssessmentMetric[]): AssessmentMetric {
  return calculateAreaOutcome(areas);
}

export function calculateScheduledHabitCompletion(input: { scheduledOccurrences: number; completedOccurrences: number }): AssessmentMetric {
  const denominator = Math.max(0, Math.floor(input.scheduledOccurrences));
  const numerator = Math.max(0, Math.min(denominator, Math.floor(input.completedOccurrences)));
  if (denominator === 0) return metric(null, 0, 0, { numerator, denominator });
  return metric(numerator / denominator * 100, denominator, 0, { numerator, denominator });
}

export function calculateAreaExecution(habits: AssessmentMetric[]): AssessmentMetric {
  const measured = habits.filter((habit) => habit.score !== null);
  if (!measured.length) return metric(null, 0, habits.length);
  return metric(measured.reduce((total, habit) => total + (habit.score || 0), 0) / measured.length, measured.length, habits.length - measured.length);
}

export type EngagementCoverage = {
  baseline: boolean;
  ptp: boolean;
  checkpoint: boolean;
  journal: boolean;
  tracking: boolean;
};

export function calculateProgramEngagement(coverage: EngagementCoverage) {
  const values: number[] = Object.values(coverage).map((value) => value ? 100 : 0);
  return metric(values.length ? values.reduce((total, value) => total + value, 0) / values.length : null, values.filter((value) => value > 0).length, values.filter((value) => value === 0).length);
}

export function calculateWeeklyPeerSupport(input: { activePairingWeeks: number; supportedWeeks: number }): AssessmentMetric {
  const denominator = Math.max(0, Math.floor(input.activePairingWeeks));
  const numerator = Math.max(0, Math.min(denominator, Math.floor(input.supportedWeeks)));
  if (denominator === 0) return metric(null, 0, 0, { numerator, denominator });
  return metric(numerator / denominator * 100, denominator, 0, { numerator, denominator });
}

const demoAssessmentRecords = [
  { participantOutcome: 94, coachAssessment: 91, execution: 91, engagement: 96, activeIndicators: 4, supportActiveWeeks: 11, pairingActiveWeeks: 12, reciprocal: true, evidenceStrength: "Sangat kuat" },
  { participantOutcome: 91, coachAssessment: 90, execution: 90, engagement: 94, activeIndicators: 3, supportActiveWeeks: 10, pairingActiveWeeks: 12, reciprocal: true, evidenceStrength: "Cukup kuat" },
  { participantOutcome: 90, coachAssessment: 88, execution: 86, engagement: 92, activeIndicators: 4, supportActiveWeeks: 10, pairingActiveWeeks: 12, reciprocal: true, evidenceStrength: "Cukup kuat" },
  { participantOutcome: 88, coachAssessment: 85, execution: 87, engagement: 90, activeIndicators: 3, supportActiveWeeks: 8, pairingActiveWeeks: 12, reciprocal: false, evidenceStrength: "Sangat kuat" },
  { participantOutcome: 86, coachAssessment: 83, execution: 85, engagement: 88, activeIndicators: 2, supportActiveWeeks: 8, pairingActiveWeeks: 12, reciprocal: true, evidenceStrength: "Cukup kuat" },
  { participantOutcome: 85, coachAssessment: 84, execution: 88, engagement: 91, activeIndicators: 3, supportActiveWeeks: 9, pairingActiveWeeks: 12, reciprocal: true, evidenceStrength: "Cukup kuat" },
] as const;

const average = (values: number[]) => Math.round(values.reduce((total, value) => total + value, 0) / values.length);

export const demoAssessmentSummary = {
  sampleSize: demoAssessmentRecords.length,
  totalParticipants: 25,
  outcome: average(demoAssessmentRecords.map((record) => record.participantOutcome)),
  execution: average(demoAssessmentRecords.map((record) => record.execution)),
  engagement: average(demoAssessmentRecords.map((record) => record.engagement)),
  peerSupport: average(demoAssessmentRecords.map((record) => record.supportActiveWeeks / record.pairingActiveWeeks * 100)),
  coachValidationCoverage: 100,
  indicatorCoverage: average(demoAssessmentRecords.map((record) => record.activeIndicators / 4 * 100)),
  validatedOutcome: average(demoAssessmentRecords.map((record) => calculateValidatedOutcome(record.participantOutcome, record.coachAssessment))),
  reciprocalSupport: average(demoAssessmentRecords.map((record) => record.reciprocal ? 100 : 0)),
};

export function getDemoParticipantAssessment(index: number) {
  const record = demoAssessmentRecords[index] ?? demoAssessmentRecords[0];
  return {
    ...record,
    validatedOutcome: calculateValidatedOutcome(record.participantOutcome, record.coachAssessment),
    coverage: record.activeIndicators / 4 * 100,
    validationStatus: "Coach Validated",
  };
}
