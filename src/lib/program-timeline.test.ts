import { describe, expect, it } from "vitest";
import {
  getActiveProgramMonth,
  getMonthEditState,
  getProgramDay,
  getProgramMonthPhase,
  getProgramMonthWindow,
} from "./program-timeline";

describe("program timeline", () => {
  it("represents dates before the program as day 0", () => {
    expect(getProgramDay("2026-08-04", new Date(2026, 7, 3))).toBe(0);
    expect(getProgramDay("2026-08-04", new Date(2026, 6, 1))).toBe(0);
    expect(getProgramDay("2026-08-04", new Date(2026, 7, 4))).toBe(1);
    expect(getProgramDay("2026-08-04", new Date(2026, 10, 9))).toBe(98);
  });

  it("has no active month before start and changes month on days 31 and 61", () => {
    expect(getActiveProgramMonth(0)).toBeNull();
    expect(getActiveProgramMonth(1)).toBe(1);
    expect(getActiveProgramMonth(30)).toBe(1);
    expect(getActiveProgramMonth(31)).toBe(2);
    expect(getActiveProgramMonth(60)).toBe(2);
    expect(getActiveProgramMonth(61)).toBe(3);
    expect(getActiveProgramMonth(98)).toBe(3);
  });

  it.each([
    [1, 1, 30, 37, 38],
    [2, 31, 60, 67, 68],
    [3, 61, 90, 97, 98],
  ] as const)("defines month %i open, due, grace, and lock cutoffs", (month, startDay, dueDay, graceEndDay, lockDay) => {
    expect(getProgramMonthWindow(month)).toEqual({ startDay, dueDay, graceEndDay, lockDay });
    expect(getProgramMonthPhase(month, startDay - 1)).toBe("LOCKED_FUTURE");
    expect(getProgramMonthPhase(month, startDay)).toBe("OPEN");
    expect(getProgramMonthPhase(month, dueDay)).toBe("DUE");
    expect(getProgramMonthPhase(month, dueDay + 1)).toBe("GRACE");
    expect(getProgramMonthPhase(month, graceEndDay)).toBe("GRACE");
    expect(getProgramMonthPhase(month, lockDay)).toBe("MATURE");
  });

  it("keeps due and grace periods editable, including month 3 through day 97", () => {
    expect(getMonthEditState(1, 0)).toBe("LOCKED_FUTURE");
    expect(getMonthEditState(1, 1)).toBe("ACTIVE");
    expect(getMonthEditState(1, 30)).toBe("ACTIVE");
    expect(getMonthEditState(1, 37)).toBe("ACTIVE");
    expect(getMonthEditState(1, 38)).toBe("LOCKED_PAST");

    expect(getMonthEditState(2, 31)).toBe("ACTIVE");
    expect(getMonthEditState(2, 60)).toBe("ACTIVE");
    expect(getMonthEditState(2, 67)).toBe("ACTIVE");
    expect(getMonthEditState(2, 68)).toBe("LOCKED_PAST");

    expect(getMonthEditState(3, 61)).toBe("ACTIVE");
    expect(getMonthEditState(3, 90)).toBe("ACTIVE");
    expect(getMonthEditState(3, 97)).toBe("ACTIVE");
    expect(getMonthEditState(3, 98)).toBe("LOCKED_PAST");
  });
});
