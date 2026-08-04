export const METHODOLOGY_VERSION = "1.0";

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
  { label: "Pencapaian Target", weight: 25, description: "Perubahan berkaitan langsung dengan target PTP." },
  { label: "Keberlanjutan", weight: 15, description: "Perubahan berpotensi bertahan setelah program." },
] as const;

export function calculateValidatedOutcome(participantOutcome: number, coachAssessment: number) {
  return Math.round(participantOutcome * 0.6 + coachAssessment * 0.4);
}

export function calculateCoachAssessment(scores: number[]) {
  return Math.round(scores.reduce((total, score, index) => total + (score / 5) * 100 * (coachAssessmentRubric[index].weight / 100), 0));
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
