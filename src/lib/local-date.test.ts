import { describe, expect, it } from "vitest";
import { getHabitOccurrenceKey, getLocalWeekStart, normalizeHabitFrequency } from "./local-date";

describe("habit occurrence dates", () => {
  it("canonicalizes supported daily and weekly labels", () => {
    expect(normalizeHabitFrequency("Daily")).toBe("daily");
    expect(normalizeHabitFrequency("Setiap hari")).toBe("daily");
    expect(normalizeHabitFrequency("Weekly")).toBe("weekly");
    expect(normalizeHabitFrequency("Pekanan")).toBe("weekly");
    expect(normalizeHabitFrequency("2 kali per pekan")).toBe("weekly");
    expect(normalizeHabitFrequency("3 kali/minggu")).toBe("weekly");
  });

  it("uses Monday as the week start in the participant timezone", () => {
    const instant = new Date("2026-08-02T18:30:00Z");
    expect(getLocalWeekStart(instant, "Asia/Jakarta")).toBe("2026-08-03");
    expect(getLocalWeekStart(instant, "UTC")).toBe("2026-07-27");
  });

  it("uses local today for daily and local Monday for weekly occurrences", () => {
    const instant = new Date("2026-08-05T12:00:00Z");
    expect(getHabitOccurrenceKey("daily", instant, "Asia/Jakarta")).toBe("2026-08-05");
    expect(getHabitOccurrenceKey("weekly", instant, "Asia/Jakarta")).toBe("2026-08-03");
  });
});
