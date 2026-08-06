import { describe, expect, it } from "vitest";
import {
  calculateAreaExecution,
  calculateAreaOutcome,
  calculateCoachAssessment,
  calculateExecutionMomentumDelta,
  calculateIndicatorCoverage,
  calculateIndicatorOutcome,
  calculateMeasurementCoverage,
  calculateNormalizedExecutionMomentum,
  calculateNormalizedMomentumByArea,
  calculateParticipantOutcome,
  calculateProgramEngagement,
  calculateScheduledHabitCompletion,
  calculateValidatedOutcome,
  calculateWeeklyPeerSupport,
  getDefaultQualityRubric,
  getQualityRubricDescription,
  validateAreaIndicators,
  type IndicatorDefinition,
} from "./assessment-methodology";

describe("assessment methodology v1.1", () => {
  it("calculates and clamps higher-is-better attainment", () => {
    expect(calculateIndicatorOutcome({ baseline: 10, target: 20, actual: 10, direction: "higher_is_better" }).score).toBe(0);
    expect(calculateIndicatorOutcome({ baseline: 10, target: 20, actual: 15, direction: "higher_is_better" }).score).toBe(50);
    expect(calculateIndicatorOutcome({ baseline: 10, target: 20, actual: 20, direction: "higher_is_better" }).score).toBe(100);
    expect(calculateIndicatorOutcome({ baseline: 10, target: 20, actual: 25, direction: "higher_is_better" }).score).toBe(100);
    expect(calculateIndicatorOutcome({ baseline: 10, target: 20, actual: 5, direction: "higher_is_better" }).score).toBe(0);
  });

  it("calculates and clamps lower-is-better attainment", () => {
    expect(calculateIndicatorOutcome({ baseline: 20, target: 10, actual: 20, direction: "lower_is_better" }).score).toBe(0);
    expect(calculateIndicatorOutcome({ baseline: 20, target: 10, actual: 15, direction: "lower_is_better" }).score).toBe(50);
    expect(calculateIndicatorOutcome({ baseline: 20, target: 10, actual: 10, direction: "lower_is_better" }).score).toBe(100);
    expect(calculateIndicatorOutcome({ baseline: 20, target: 10, actual: 5, direction: "lower_is_better" }).score).toBe(100);
    expect(calculateIndicatorOutcome({ baseline: 20, target: 10, actual: 25, direction: "lower_is_better" }).score).toBe(0);
  });

  it("does not measure an indicator with no denominator", () => {
    const result = calculateIndicatorOutcome({ baseline: 10, target: 10, actual: 10, direction: "higher_is_better" });
    expect(result.score).toBeNull();
    expect(result.measuredCount).toBe(0);
    expect(result.excludedCount).toBe(1);
    expect(calculateIndicatorOutcome({ baseline: 10, target: 20, actual: Number.NaN, direction: "higher_is_better" }).score).toBeNull();
  });

  it("keeps structural and measurement coverage separate from outcome", () => {
    expect(calculateIndicatorCoverage(2).score).toBe(50);
    expect(calculateMeasurementCoverage(1, 2).score).toBe(50);
    expect(calculateMeasurementCoverage(0, 0).score).toBeNull();
    expect(calculateAreaOutcome([{ score: 90, measuredCount: 1, excludedCount: 0, methodologyVersion: "1.0" }]).score).toBe(90);
  });

  it("ignores null values in area and participant aggregation", () => {
    const measured = { score: 80, measuredCount: 1, excludedCount: 0, methodologyVersion: "1.0" };
    const unavailable = { score: null, measuredCount: 0, excludedCount: 1, methodologyVersion: "1.0" };
    expect(calculateAreaOutcome([measured, unavailable])).toMatchObject({ score: 80, measuredCount: 1, excludedCount: 1 });
    expect(calculateParticipantOutcome([unavailable, measured])).toMatchObject({ score: 80, measuredCount: 1, excludedCount: 1 });
    expect(calculateParticipantOutcome([unavailable]).score).toBeNull();
  });

  it("uses scheduled occurrences as the execution denominator", () => {
    expect(calculateScheduledHabitCompletion({ scheduledOccurrences: 10, completedOccurrences: 7 }).score).toBe(70);
    expect(calculateAreaExecution([{ score: 70, measuredCount: 10, excludedCount: 0, methodologyVersion: "1.0" }]).score).toBe(70);
  });

  it("calculates an unbounded execution momentum delta", () => {
    expect(calculateExecutionMomentumDelta({ scheduledUnits: 3, completedUnits: 3 })).toBe(3);
    expect(calculateExecutionMomentumDelta({ scheduledUnits: 3, completedUnits: 2 })).toBe(1);
    expect(calculateExecutionMomentumDelta({ scheduledUnits: 3, completedUnits: 1 })).toBe(-1);
    expect(calculateExecutionMomentumDelta({ scheduledUnits: 3, completedUnits: 0 })).toBe(-3);
  });

  it("normalizes momentum so habit quantity and area size are comparable", () => {
    expect(calculateNormalizedExecutionMomentum({ scheduledUnits: 4, completedUnits: 4 })).toBe(1);
    expect(calculateNormalizedExecutionMomentum({ scheduledUnits: 4, completedUnits: 2 })).toBe(0);
    expect(calculateNormalizedExecutionMomentum({ scheduledUnits: 4, completedUnits: 0 })).toBe(-1);
    expect(calculateNormalizedExecutionMomentum({ scheduledUnits: 5, completedUnits: 3 })).toBeCloseTo(0.2);
    expect(calculateNormalizedExecutionMomentum({ scheduledUnits: 0, completedUnits: 0 })).toBeNull();
    expect(calculateNormalizedExecutionMomentum({ scheduledUnits: 2, completedUnits: 9 })).toBe(1);
  });

  it("averages normalized momentum across habits in an area", () => {
    expect(calculateNormalizedMomentumByArea({ "Spiritual Growth": [1, 0, -1] })).toEqual({ "Spiritual Growth": 0 });
    expect(calculateNormalizedMomentumByArea({ A: [1, 1], B: [] })).toEqual({ A: 1, B: 0 });
  });

  it("leaves execution unmeasured when an area has no habits", () => {
    expect(calculateAreaExecution([])).toMatchObject({ score: null, measuredCount: 0, excludedCount: 0 });
  });

  it("validates active indicators per area", () => {
    const validIndicator: IndicatorDefinition = {
      key: "quality",
      type: "quality",
      label: "Kualitas komunikasi",
      active: true,
      direction: "higher_is_better",
      baseline: 2,
      target: 4,
      unit: "skor 1-5",
      qualityRubric: getDefaultQualityRubric(),
    };
    expect(validateAreaIndicators([validIndicator], "Relationship")).toEqual({ valid: true, errors: [] });

    const invalid = validateAreaIndicators([
      { ...validIndicator, key: "first", label: "", unit: "", baseline: Number.NaN, target: Number.POSITIVE_INFINITY },
      { ...validIndicator, key: "second", baseline: -1, target: -1 },
    ], "Relationship");
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "required_label",
      "required_unit",
      "invalid_baseline",
      "invalid_target",
      "equal_baseline_target",
      "duplicate_type",
    ]));
    expect(invalid.errors.every((error) => error.area === "Relationship")).toBe(true);
  });

  it("requires one to four active indicators", () => {
    expect(validateAreaIndicators([], "Spiritual Growth").errors.map((error) => error.code)).toContain("indicator_count");
    const indicators = (["quality", "quantity", "time", "cost", "quality"] as const).map((type, index): IndicatorDefinition => ({
      key: `${type}-${index}`,
      type,
      label: `${type} ${index}`,
      active: true,
      direction: "higher_is_better",
      baseline: index,
      target: index + 1,
      unit: "skor",
    }));
    expect(validateAreaIndicators(indicators).errors.map((error) => error.code)).toContain("indicator_count");
  });

  it("validates actual source and quality rubric on active indicators", () => {
    const base: IndicatorDefinition = {
      key: "quality",
      type: "quality",
      label: "Kualitas ibadah",
      active: true,
      direction: "higher_is_better",
      baseline: 1,
      target: 5,
      unit: "skor 1-5",
      actualSource: "self_report",
      linkedActionPlanIds: ["plan-a"],
      qualityRubric: getDefaultQualityRubric(),
    };
    expect(validateAreaIndicators([base], "Spiritual Growth").valid).toBe(true);

    const invalidSource = validateAreaIndicators([{ ...base, actualSource: "sistem" as any }], "Spiritual Growth");
    expect(invalidSource.errors.map((error) => error.code)).toContain("invalid_actual_source");

    const invalidRubric = validateAreaIndicators([{ ...base, qualityRubric: { 1: "satu", 2: "dua" } }], "Spiritual Growth");
    expect(invalidRubric.errors.map((error) => error.code)).toContain("invalid_quality_rubric");

    const blankRubric = validateAreaIndicators([{ ...base, qualityRubric: { 1: "", 2: "dua", 3: "tiga", 4: "empat", 5: "lima" } }], "Spiritual Growth");
    expect(blankRubric.errors.map((error) => error.code)).toContain("invalid_quality_rubric");
  });

  it("resolves a quality rubric description with default fallback", () => {
    expect(getQualityRubricDescription(undefined, 4)).toBe("Sering konsisten, hasil mulai jelas");
    expect(getQualityRubricDescription({ 4: "Sudah sangat baik" }, 4)).toBe("Sudah sangat baik");
    expect(getQualityRubricDescription({ 4: "Sudah sangat baik" }, null)).toBeNull();
    expect(getQualityRubricDescription(undefined, 6)).toBeNull();
  });

  it("handles an incomplete indicator loaded from an older draft", () => {
    const incompleteIndicator = {
      key: "legacy",
      type: "quantity",
      active: true,
      direction: "higher_is_better",
      baseline: 0,
      target: 1,
      unit: "kali",
    } as IndicatorDefinition;

    expect(() => validateAreaIndicators([incompleteIndicator], "Spiritual Growth")).not.toThrow();
    expect(validateAreaIndicators([incompleteIndicator], "Spiritual Growth").errors.map((error) => error.code)).toContain("required_label");
  });

  it("calculates all four coach rubric weights", () => {
    expect(calculateCoachAssessment([5, 4, 3, 2])).toBe(75);
  });

  it("rejects incomplete and invalid coach rubric inputs instead of clamping", () => {
    expect(() => calculateCoachAssessment([5, 4, 3])).toThrow(/tepat 4/);
    expect(() => calculateCoachAssessment([5, 4, 3, 6])).toThrow(RangeError);
    expect(() => calculateCoachAssessment([5, 4, 3, Number.NaN])).toThrow(RangeError);
  });

  it("calculates separate engagement and peer-support metrics", () => {
    expect(calculateProgramEngagement({ baseline: true, ptp: true, checkpoint: false, journal: true, tracking: false }).score).toBe(60);
    expect(calculateWeeklyPeerSupport({ activePairingWeeks: 12, supportedWeeks: 9 }).score).toBe(75);
  });

  it("calculates validated outcome with the documented split", () => {
    expect(calculateValidatedOutcome(80, 90)).toBe(84);
  });
});
