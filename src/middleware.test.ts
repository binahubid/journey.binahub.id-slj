import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const fixture = vi.hoisted(() => ({
  path: "",
  access: null as Record<string, unknown> | null,
  profile: { role: "participant", program_code: "SLJ-PROGRAM" },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: (rows: unknown[]) => void } },
  ) => ({
    auth: {
      getUser: async () => {
        options.cookies.setAll([
          {
            name: "fixture-refresh",
            value: "refreshed-session",
            options: { httpOnly: true },
          },
        ]);
        return {
          data: {
            user: { id: "participant", app_metadata: { role: "participant" } },
          },
        };
      },
    },
    rpc: async () => ({
      data: fixture.access,
      error: fixture.access ? null : { code: "PGRST202" },
    }),
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => ({
          data:
            table === "profiles"
              ? fixture.profile
              : table === "journeys"
                ? { status: "ACTIVE", area_transformasi: [] }
                : null,
        }),
      };
      return query;
    },
  }),
}));
import { middleware } from "./middleware";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://slj-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-only");
  fixture.access = null;
  fixture.profile = { role: "participant", program_code: "SLJ-PROGRAM" };
});

describe("participant navigation", () => {
  it("preserves a refreshed session when redirecting an existing participant", async () => {
    const response = await middleware(
      new NextRequest("https://slj-fixture.invalid/login"),
    );
    expect(response.headers.get("location")).toBe(
      "https://slj-fixture.invalid/dashboard",
    );
    expect(response.cookies.get("fixture-refresh")?.value).toBe(
      "refreshed-session",
    );
  });

  it("keeps the fourteen-day trial out of the three-area PTP onboarding", async () => {
    fixture.profile.program_code = "SLJ-TRIAL-14";
    fixture.access = { kind: "trial", active: true, days: 14 };
    const response = await middleware(
      new NextRequest("https://slj-fixture.invalid/dashboard"),
    );
    expect(response.headers.get("location")).toBe(
      "https://slj-fixture.invalid/trial",
    );
    expect(response.cookies.get("fixture-refresh")?.value).toBe(
      "refreshed-session",
    );
  });

  it("allows public instructions for a participant who has not enrolled", async () => {
    fixture.profile.program_code = "";
    const response = await middleware(
      new NextRequest("https://slj-fixture.invalid/panduan"),
    );
    expect(response.headers.get("location")).toBeNull();
  });
});
