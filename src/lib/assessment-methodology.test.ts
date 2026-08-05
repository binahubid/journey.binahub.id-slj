import { describe, expect, it } from "vitest";
import {
  calculateAreaExecution,
  calculateAreaOutcome,
  calculateCoachAssessment,
  calculateIndicatorCoverage,
  calculateIndicatorOutcome,
  calculateMeasurementCoverage,
  calculateParticipantOutcome,
  calculateProgramEngagement,
  calculateScheduledHabitCompletion,
  calculateValidatedOutcome,
  calculateWeeklyPeerSupport,
  validateAreaIndicators,
  type IndicatorDefinition,
} from "./assessment-methodology";

describe("assessment methodology v1.0", () => {
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
