import { describe, expect, it } from "vitest";
import { summarizeGroupImpact, type GroupImpactReport } from "./assessment-report";

describe("summarizeGroupImpact", () => {
  it("reads engagement objects from their met property", () => {
    const report: GroupImpactReport = {
      methodology_version: "1.0",
      participants: [
        {
          user_id: "participant-1",
          journey_id: "journey-1",
          methodology_version: "1.0",
          metrics: {
            outcome: { score: null, numerator: 0, denominator: 0 },
            execution: { score: null, numerator: 0, denominator: 0 },
            engagement: {
              baseline: true,
              ptp: false,
              checkpoint: { met: false, numerator: 0, denominator: 0, coverage: null },
              journal: { met: false, journal_days: 1, total_days: 4, consistency: 25 },
              tracking: true,
            },
            peer_support: { score: null, numerator: 0, denominator: 0 },
            coach_assessment: null,
          },
        },
      ],
    };

    const summary = summarizeGroupImpact(report);

    expect(summary.engagement.baseline.coverage).toBe(100);
    expect(summary.engagement.tracking.coverage).toBe(100);
    expect(summary.engagement.ptp.coverage).toBe(0);
    expect(summary.engagement.checkpoint.coverage).toBe(0);
    expect(summary.engagement.journal.coverage).toBe(0);
  });
});
