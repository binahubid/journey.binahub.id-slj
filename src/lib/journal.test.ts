import { describe, expect, it } from "vitest";
import { composeJournalContent, getCanonicalJournalDate, getJournalStreak, parseJournalContent } from "./journal";

describe("journal helpers", () => {
  it("matches stored dates by their canonical calendar date", () => {
    expect(getCanonicalJournalDate("2026-08-04")).toBe("2026-08-04");
    expect(getCanonicalJournalDate("2026-08-04T23:30:00+07:00")).toBe("2026-08-04");
    expect(getCanonicalJournalDate(undefined)).toBe("");
  });

  it("round-trips structured journal sections", () => {
    const content = composeJournalContent("Refleksi", "Pelajaran", "Perbaikan");
    expect(parseJournalContent(content)).toEqual({
      reflection: "Refleksi",
      lesson: "Pelajaran",
      improvement: "Perbaikan",
    });
  });

  it("keeps tomorrow's plan separate when the lesson field is empty", () => {
    expect(parseJournalContent(composeJournalContent("Refleksi", "", "Perbaikan"))).toEqual({
      reflection: "Refleksi",
      lesson: "",
      improvement: "Perbaikan",
    });
  });

  it("uses the participant's calendar date for a streak", () => {
    expect(getJournalStreak(["2026-11-12", "2026-11-11"], "2026-11-13")).toBe(2);
    expect(getJournalStreak(["2026-11-12", "2026-11-11"], "2026-11-14")).toBe(0);
  });
});
