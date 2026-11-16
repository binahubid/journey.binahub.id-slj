import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as prayerLocation from "../../supabase/functions/_shared/prayer-location";

type PrayerSettings = {
  preferred_prayer_city: string;
  prayer_reminder_minutes: number;
  profiles: { location?: string | null; timezone?: string | null; role: string; program_code: string };
};

const source = ts.transpileModule(
  readFileSync(new URL("../../supabase/functions/send-user-reminders/index.ts", import.meta.url), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;

async function runWorker(settings: PrayerSettings, now = "2026-11-16T09:00:00Z") {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
  let handler: (request: Request) => Promise<Response> = async () => { throw new Error("Worker not started"); };
  const notifications: Record<string, unknown>[] = [];
  const fetch = vi.fn(async (address: string) => {
    const url = new URL(address);
    // Aladhan returns the requested city's astronomical times in the requested zone.
    const city = url.searchParams.get("city");
    return Response.json({ data: { timings: {
      Fajr: "05:15", Dhuhr: city === "Madinah" ? "12:10" : city === "Makassar" ? "17:10" : "16:10",
      Asr: "15:16", Maghrib: "17:42", Isha: "19:12",
    } } });
  });
  const selected: string[] = [];
  const database = {
    from(table: string) {
      return {
        select(columns: string) {
          selected.push(columns);
          return {
            eq() {
              expect(table).toBe("settings");
              // A database selection only returns columns the worker actually requested.
              const row = {
                ...settings,
                user_id: "00000000-0000-4000-8000-000000000001",
                profiles: { ...settings.profiles, location: columns.includes("location") ? settings.profiles.location : undefined },
              };
              return Promise.resolve({ data: [row], error: null });
            },
          };
        },
        insert(row: Record<string, unknown>) {
          expect(table).toBe("notifications");
          notifications.push(row);
          return Promise.resolve({ error: null });
        },
      };
    },
    rpc: vi.fn(async () => ({ data: [], error: null })),
  };
  runInNewContext(source, {
    exports: {},
    require(name: string) {
      if (name.startsWith("https://deno.land/")) return { serve(callback: typeof handler) { handler = callback; } };
      if (name.startsWith("https://esm.sh/")) return { createClient: () => database };
      if (name.startsWith("npm:web-push")) return { default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() } };
      if (name === "../_shared/prayer-location.ts") return prayerLocation;
      throw new Error("Unmocked worker dependency " + name);
    },
    Deno: { env: { get: () => "synthetic-worker-test" } },
    Date, Intl, Response, AbortSignal, fetch,
  });
  const response = await handler(new Request("https://worker.example.invalid", {
    method: "POST", headers: { "x-cron-secret": "synthetic-worker-test" },
  }));
  return { response, fetch, selected, notifications };
}

afterEach(() => vi.useRealTimers());

describe("prayer push reminders during travel", () => {
  it("uses the Madinah location and chosen Saudi timezone even when the older settings city is Jakarta", async () => {
    const result = await runWorker({
      preferred_prayer_city: "Jakarta",
      prayer_reminder_minutes: 10,
      profiles: { location: "Madinah", timezone: "Asia/Riyadh", role: "participant", program_code: "SLJ-DEMO" },
    });
    expect(result.response.status).toBe(200);
    expect(result.fetch).toHaveBeenCalledTimes(1);
    const url = new URL(result.fetch.mock.calls[0][0]);
    expect(url.searchParams.get("city")).toBe("Madinah");
    expect(url.searchParams.get("country")).toBe("Saudi Arabia");
    expect(url.searchParams.get("timezonestring")).toBe("Asia/Riyadh");
    expect(result.notifications).toEqual([expect.objectContaining({ title: "10 menit menuju Dzuhur" })]);
  });

  it("infers the Saudi zone from the chosen city when the profile timezone is missing", async () => {
    const result = await runWorker({
      preferred_prayer_city: "Madinah",
      prayer_reminder_minutes: 10,
      profiles: { location: "", timezone: null, role: "participant", program_code: "SLJ-DEMO" },
    });
    expect(result.response.status).toBe(200);
    expect(new URL(result.fetch.mock.calls[0][0]).searchParams.get("timezonestring")).toBe("Asia/Riyadh");
    expect(result.notifications).toHaveLength(1);
  });

  it("does not fall back to Jakarta at the Saudi midnight boundary", async () => {
    const result = await runWorker({
      preferred_prayer_city: "Jakarta",
      prayer_reminder_minutes: 10,
      profiles: { location: "Medina", timezone: "Asia/Riyadh", role: "participant", program_code: "SLJ-DEMO" },
    }, "2026-11-16T21:05:00Z");
    const url = new URL(result.fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/v1/timingsByCity/17-11-2026");
    expect(url.searchParams.get("city")).toBe("Madinah");
    expect(result.notifications).toHaveLength(0);
  });

  it.each([
    ["Jakarta", "Asia/Jakarta", "Indonesia", "20"],
    ["Makassar", "Asia/Makassar", "Indonesia", "20"],
  ])("keeps the selected %s schedule", async (city, timezone, country, method) => {
    const result = await runWorker({
      preferred_prayer_city: city,
      prayer_reminder_minutes: 10,
      profiles: { location: city, timezone, role: "participant", program_code: "SLJ-DEMO" },
    });
    expect(result.response.status).toBe(200);
    const url = new URL(result.fetch.mock.calls[0][0]);
    expect(url.searchParams.get("city")).toBe(city);
    expect(url.searchParams.get("country")).toBe(country);
    expect(url.searchParams.get("method")).toBe(method);
    expect(url.searchParams.get("timezonestring")).toBe(timezone);
    expect(result.notifications).toHaveLength(1);
  });

  it("keeps reminders inside the selected city's prayer window", async () => {
    const settings = {
      preferred_prayer_city: "Jakarta", prayer_reminder_minutes: 10,
      profiles: { location: "Madinah", timezone: "Asia/Riyadh", role: "participant", program_code: "SLJ-DEMO" },
    };
    expect((await runWorker(settings, "2026-11-16T08:59:00Z")).notifications).toHaveLength(0);
    expect((await runWorker(settings, "2026-11-16T09:11:00Z")).notifications).toHaveLength(0);
  });
});
