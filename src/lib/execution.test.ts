import { describe, expect, it } from "vitest";
import { calculateExecution, type ExecutionHabit } from "./execution";

const habit = (id: string, area: string, quantity = 1, frequency = "daily"): ExecutionHabit => ({
  id, area, quantity, frequency,
});

describe("scheduled execution", () => {
  it("gives equal weight to habits and measured areas, regardless of quantity", () => {
    const result = calculateExecution({ startDate: "2026-11-09", endDate: "2026-11-09",
      areas: ["A", "B", "C"], habits: [habit("a", "A"), habit("b", "A", 10), habit("c", "B")],
      logs: [{ habit_id: "a", date: "2026-11-09", completed_count: 1 }, { habit_id: "c", date: "2026-11-09", completed_count: 1 }],
    });
    expect(result.score).toBe(75);
    expect(result.areas.A.score).toBe(50);
    expect(result.areas.C.score).toBeNull();
  });

  it("counts a weekly occurrence once from its first eligible day, even midweek", () => {
    const result = calculateExecution({ startDate: "2026-11-11", endDate: "2026-11-16",
      areas: ["A"], habits: [habit("a", "A", 2, "weekly")],
      logs: [{ habit_id: "a", date: "2026-11-09", activity_date: "2026-11-12", completed_count: 2 }],
    });
    expect(result.score).toBe(50);
    expect(result.scheduled).toBe(4);
    expect(result.timeline[0].scores.A).toBe(0);
    expect(result.timeline[1].scores.A).toBe(100);
  });

  it("clamps each occurrence and respects effective dates, future data, and canonical rows", () => {
    const result = calculateExecution({ startDate: "2026-11-09", endDate: "2026-11-12", areas: ["A"],
      habits: [{ ...habit("a", "A", 2), effectiveFrom: "2026-11-10", effectiveUntil: "2026-11-11" }],
      logs: [
        { habit_id: "a", date: "2026-11-09", completed_count: 2 },
        { habit_id: "a", date: "2026-11-10", completed_count: 99 },
        { habit_id: "a", date: "2026-11-11", completed_count: 2, is_canonical_occurrence: false },
        { habit_id: "a", date: "2026-11-12", completed_count: 2 },
      ],
    });
    expect(result.score).toBe(50);
    expect(result.completed).toBe(2);
    expect(result.scheduled).toBe(4);
  });

  it("keeps unsupported schedules unmeasured and follows defined custom weekdays", () => {
    const result = calculateExecution({ startDate: "2026-11-09", endDate: "2026-11-15", areas: ["A", "B"],
      habits: [{ ...habit("a", "A", 1, "custom"), weekdays: [1, 3] }, habit("b", "B", 1, "sometimes")], logs: [],
    });
    expect(result.areas.A.scheduled).toBe(2);
    expect(result.areas.A.score).toBe(0);
    expect(result.areas.B.score).toBeNull();
    expect(result.areas.B.unsupported).toBe(1);
  });

  it("does not invent progress before the program starts or beyond day 90", () => {
    const before = calculateExecution({ startDate: "2026-11-16", endDate: "2026-11-14", areas: ["A"], habits: [habit("a", "A")], logs: [] });
    expect(before.score).toBeNull();
    expect(before.timeline).toEqual([]);
    const after = calculateExecution({ startDate: "2026-01-01", endDate: "2026-12-31", areas: ["A"], habits: [habit("a", "A")], logs: [] });
    expect(after.scheduled).toBe(90);
  });
});
