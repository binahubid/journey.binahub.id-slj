import { describe, expect, it } from "vitest";
import { detectHabitCategory, getPrayerKeyFromHabitTitle } from "./habit-tracking";

describe("habit tracking normalization", () => {
  it("matches common Dhuha spelling variants", () => {
    expect(getPrayerKeyFromHabitTitle("Sholat Dhuha")).toBe("dhuha");
    expect(getPrayerKeyFromHabitTitle("sholat duha")).toBe("dhuha");
    expect(getPrayerKeyFromHabitTitle("Salat Duha 2 rakaat")).toBe("dhuha");
  });

  it("recognizes supported sunnah prayer habits", () => {
    expect(getPrayerKeyFromHabitTitle("Shalat Rawatib")).toBe("rawatib");
    expect(getPrayerKeyFromHabitTitle("Sholat Hajat")).toBe("hajat");
    expect(detectHabitCategory("Sholat Istikharah")).toBe("prayer");
  });
});
