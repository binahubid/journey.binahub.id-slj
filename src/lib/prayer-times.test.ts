import { describe, expect, it } from "vitest";
import { prayerTimesUrl, zonedMinutes } from "./prayer-times";

describe("prayer locations and travel", () => {
  it("requests Saudi prayer times for Indonesian spellings of the Umrah cities", () => {
    for (const city of ["Mekah", "Makkah", "Madinah", "Medina", "Jeddah"]) {
      const url = new URL(prayerTimesUrl(city, "2026-11-13"));
      expect(url.pathname).toBe("/v1/timingsByCity/13-11-2026");
      expect(url.searchParams.get("country")).toBe("Saudi Arabia");
      expect(url.searchParams.get("method")).toBe("4");
      expect(url.searchParams.get("timezonestring")).toBe("Asia/Riyadh");
    }
  });
  it("uses Kemenag for Indonesia and keeps the chosen local timezone", () => {
    const url = new URL(
      prayerTimesUrl("Makassar", "2026-11-14", "Asia/Makassar"),
    );
    expect(url.searchParams.get("country")).toBe("Indonesia");
    expect(url.searchParams.get("method")).toBe("20");
    expect(url.searchParams.get("timezonestring")).toBe("Asia/Makassar");
  });
  it("calculates countdowns in the participant timezone regardless of the device timezone", () => {
    const now = new Date("2026-11-13T02:00:00Z");
    expect(zonedMinutes(now, "Asia/Riyadh")).toBe(5 * 60);
    expect(zonedMinutes(now, "Asia/Jakarta")).toBe(9 * 60);
  });
});
