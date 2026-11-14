"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, RefreshCw } from "lucide-react";
import { getLocalDateString, normalizeTimeZone } from "@/lib/local-date";
import {
  getPrayerLocation,
  prayerTimesUrl,
  zonedMinutes,
} from "@/lib/prayer-times";

const prayers = [
  ["Fajr", "Subuh"],
  ["Dhuhr", "Zuhur"],
  ["Asr", "Asar"],
  ["Maghrib", "Magrib"],
  ["Isha", "Isya"],
] as const;

export function PrayerTimesWidget({
  location = "Jakarta",
  timeZone,
}: {
  location?: string;
  timeZone?: string;
}) {
  const zone = normalizeTimeZone(
    timeZone || getPrayerLocation(location).timeZone,
  );
  const [now, setNow] = useState(Date.now());
  const today = getLocalDateString(new Date(now), zone);
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setTimings(null);
    setError(false);
    async function load() {
      try {
        const response = await fetch(prayerTimesUrl(location, today, zone), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unavailable");
        const result = await response.json();
        const values = result?.data?.timings;
        if (
          !values ||
          prayers.some(([key]) => !/^\d{2}:\d{2}/.test(values[key] || ""))
        )
          throw new Error("Incomplete");
        if (!controller.signal.aborted) setTimings(values);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [location, zone, today, retry]);

  const current = zonedMinutes(new Date(now), zone);
  const next = timings
    ? prayers.find(([key]) => {
        const [hour, minute] = timings[key].slice(0, 5).split(":").map(Number);
        return hour * 60 + minute > current;
      })?.[0]
    : null;

  return (
    <section
      className="h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-label="Jadwal salat"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-navy-900">Jadwal salat</h3>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {new Intl.DateTimeFormat("id-ID", {
          timeZone: zone,
          day: "numeric",
          month: "long",
        }).format(now)}{" "}
        · {zone}
      </p>
      {error ? (
        <div role="status" className="py-8 text-sm leading-6 text-slate-600">
          <p>Jadwal belum dapat dimuat. Periksa koneksi atau nama kota Anda.</p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-navy-900"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      ) : !timings ? (
        <p role="status" className="py-10 text-sm text-slate-500">
          Memuat jadwal…
        </p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {prayers.map(([key, label]) => (
            <div
              key={key}
              className={`flex min-h-12 items-center justify-between gap-3 text-sm ${key === next ? "font-semibold text-navy-900" : "text-slate-600"}`}
            >
              <span>
                {label}
                {key === next && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
                    Berikutnya
                  </span>
                )}
              </span>
              <span className="tabular-nums">{timings[key].slice(0, 5)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Sumber: Aladhan</span>
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center font-medium text-navy-900 underline underline-offset-4"
        >
          Ubah kota & waktu
        </Link>
      </div>
    </section>
  );
}
