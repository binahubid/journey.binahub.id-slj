import { describe, expect, it } from "vitest";
import { composeJournalContent, getCanonicalJournalDate, parseJournalContent } from "./journal";

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
});
