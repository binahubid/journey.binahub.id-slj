import { describe, expect, it } from "vitest";
import {
  getTrialDestination,
  getTrialProgress,
  type SljAccess,
} from "./program-access";

const trial: SljAccess = {
  kind: "trial",
  active: true,
  starts_at: "2026-11-13T08:00:00Z",
  expires_at: "2026-11-27T08:00:00Z",
  days: 14,
  user_id: "example",
  full_name: "Peserta",
  timezone: "Asia/Jakarta",
};

describe("SLJ trial access", () => {
  it("counts fourteen complete days from activation and locks exactly at expiration", () => {
    expect(getTrialProgress(trial, Date.parse(trial.starts_at!))).toMatchObject(
      { day: 1, remainingDays: 14, expired: false },
    );
    expect(
      getTrialProgress(trial, Date.parse(trial.expires_at!) - 1),
    ).toMatchObject({ day: 14, remainingDays: 1, expired: false });
    expect(
      getTrialProgress(trial, Date.parse(trial.expires_at!)),
    ).toMatchObject({ day: 14, remainingDays: 0, expired: true, percent: 100 });
  });

  it("allows spiritual trial, journal, settings, and an explicit program upgrade", () => {
    for (const path of [
      "/trial",
      "/journal",
      "/profile",
      "/settings",
      "/notifications",
    ])
      expect(getTrialDestination(trial, path)).toBeNull();
    for (const path of [
      "/dashboard",
      "/journey",
      "/monitoring",
      "/initial-process",
      "/baseline",
    ])
      expect(getTrialDestination(trial, path)).toBe("/trial");
    expect(getTrialDestination(trial, "/onboarding", true)).toBeNull();
    expect(getTrialDestination({ ...trial, active: false }, "/journal")).toBe(
      "/trial",
    );
  });

  it("preserves full program accounts and treats missing dates as unavailable", () => {
    expect(
      getTrialDestination({ ...trial, kind: "program" }, "/dashboard"),
    ).toBeNull();
    expect(getTrialDestination(null, "/dashboard")).toBeNull();
    expect(getTrialProgress({ ...trial, starts_at: null })).toMatchObject({
      expired: true,
      remainingDays: 0,
    });
  });
});
