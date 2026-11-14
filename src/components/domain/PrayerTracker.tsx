"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TIME_ZONE, getLocalDateRange } from "@/lib/local-date";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PrayerTrackerProps {
  userId: string;
  onPrayerToggle?: (
    dateStr: string,
    prayerName: string,
    isCompleted: boolean,
  ) => void;
  externalLogs?: Record<string, boolean>;
  accountCreatedDate?: string;
  timeZone?: string;
  view?: "today" | "week";
  headerAction?: ReactNode;
}
const mandatory = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Zuhur" },
  { key: "ashar", label: "Asar" },
  { key: "maghrib", label: "Magrib" },
  { key: "isya", label: "Isya" },
];
const sunnah = [
  { key: "tahajud", label: "Tahajud" },
  { key: "dhuha", label: "Duha" },
  { key: "rawatib", label: "Rawatib" },
  { key: "witir", label: "Witir" },
  { key: "tarawih", label: "Tarawih" },
  { key: "hajat", label: "Hajat" },
  { key: "istikharah", label: "Istikharah" },
  { key: "taubat", label: "Tobat" },
];
const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function PrayerTracker({
  userId,
  accountCreatedDate,
  onPrayerToggle,
  externalLogs,
  timeZone = DEFAULT_TIME_ZONE,
  view = "week",
  headerAction,
}: PrayerTrackerProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<Record<string, boolean>>({});
  const [activeSunnah, setActiveSunnah] = useState<string[]>([]);
  const [showSunnah, setShowSunnah] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const externalLogsRef = useRef(externalLogs);
  externalLogsRef.current = externalLogs;
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (externalLogs) setLogs((previous) => ({ ...previous, ...externalLogs }));
  }, [externalLogs]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoaded(false);
      setError("");
      const { data, error: failure } = await supabase
        .from("prayer_logs")
        .select("date, prayer_name, is_completed")
        .eq("user_id", userId);
      if (cancelled) return;
      if (failure)
        setError(
          "Catatan salat belum dapat dimuat. Coba muat ulang sebelum mengubah catatan.",
        );
      else {
        setLoaded(true);
        const values: Record<string, boolean> = {};
        const keys: string[] = [];
        for (const row of data || []) {
          values[`${row.date}_${row.prayer_name}`] = row.is_completed;
          if (
            row.is_completed &&
            sunnah.some((item) => item.key === row.prayer_name)
          )
            keys.push(row.prayer_name);
        }
        setLogs({ ...values, ...externalLogsRef.current });
        setActiveSunnah((previous) => [...new Set([...previous, ...keys])]);
      }
      setLoading(false);
    }
    if (userId) void load();
    return () => {
      cancelled = true;
    };
  }, [userId, supabase, retry]);

  async function togglePrayer(date: string, prayer: string) {
    const key = `${date}_${prayer}`;
    if (pendingRef.current.has(key)) return;
    const current = Boolean(logs[key]);
    pendingRef.current.add(key);
    setPending(new Set(pendingRef.current));
    setError("");
    setLogs((previous) => ({ ...previous, [key]: !current }));
    onPrayerToggle?.(date, prayer, !current);
    try {
      const result = !current
        ? await supabase
            .from("prayer_logs")
            .upsert(
              {
                user_id: userId,
                date,
                prayer_name: prayer,
                is_completed: true,
              },
              { onConflict: "user_id,date,prayer_name" },
            )
        : await supabase
            .from("prayer_logs")
            .delete()
            .eq("user_id", userId)
            .eq("date", date)
            .eq("prayer_name", prayer);
      if (result.error) throw result.error;
    } catch {
      setLogs((previous) => ({ ...previous, [key]: current }));
      onPrayerToggle?.(date, prayer, current);
      setError(
        "Perubahan belum tersimpan. Pilihan sudah dikembalikan. Periksa koneksi atau masa akses Anda, lalu coba lagi.",
      );
    } finally {
      pendingRef.current.delete(key);
      setPending(new Set(pendingRef.current));
    }
  }

  const days = getLocalDateRange(view === "today" ? 1 : 7, timeZone);
  const today = days[days.length - 1].dateStr;
  const prayers = [
    ...mandatory,
    ...sunnah.filter((item) => activeSunnah.includes(item.key)),
  ];
  const completed = mandatory.filter(
    (item) => logs[`${today}_${item.key}`],
  ).length;
  function prayerButton(
    date: string,
    prayer: (typeof mandatory)[number],
    compact = false,
  ) {
    const key = `${date}_${prayer.key}`;
    const checked = Boolean(logs[key]);
    const locked = Boolean(accountCreatedDate && date < accountCreatedDate);
    return (
      <button
        type="button"
        aria-pressed={checked}
        aria-label={`${prayer.label}, ${date}${locked ? ", sebelum perjalanan dimulai" : ""}`}
        disabled={!loaded || locked || pending.has(key)}
        onClick={() => void togglePrayer(date, prayer.key)}
        className={`flex min-h-11 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 disabled:opacity-50 ${compact ? "mx-auto w-11 justify-center" : "w-full justify-between gap-3 px-3 py-2 text-sm"} ${checked ? "bg-blue-50 font-medium text-navy-900" : "text-slate-600 hover:bg-slate-50"}`}
      >
        {!compact && <span>{prayer.label}</span>}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${checked ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white"}`}
        >
          {pending.has(key) ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : checked ? (
            <Check className="h-4 w-4" />
          ) : null}
        </span>
      </button>
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-label="Catatan salat"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-navy-900">Catatan salat</h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">
            Hari ini {completed} / 5
          </span>
          {headerAction}
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="ml-1 min-h-11 font-medium underline"
          >
            Muat ulang
          </button>
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8 text-sm text-slate-500">
          Memuat catatan salat…
        </p>
      ) : view === "today" ? (
        <div className="space-y-1">
          {prayers.map((prayer) => (
            <div key={prayer.key}>{prayerButton(today, prayer)}</div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-xs">
            <caption className="sr-only">
              Catatan salat tujuh hari terakhir
            </caption>
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium">
                  Salat
                </th>
                {days.map((day) => (
                  <th
                    scope="col"
                    key={day.dateStr}
                    className={`pb-2 text-center font-medium ${day.isToday ? "text-navy-900" : "text-slate-500"}`}
                  >
                    {weekdays[day.dayIndex]}
                    <span className="block pt-1 tabular-nums">
                      {day.dayNum}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prayers.map((prayer) => (
                <tr key={prayer.key} className="border-t border-slate-100">
                  <th
                    scope="row"
                    className="py-1 text-left font-medium text-slate-600"
                  >
                    {prayer.label}
                  </th>
                  {days.map((day) => (
                    <td key={day.dateStr} className="py-1">
                      {prayerButton(day.dateStr, prayer, true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowSunnah(true)}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        Kelola salat sunnah
      </button>
      <Dialog open={showSunnah} onOpenChange={setShowSunnah}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salat sunnah</DialogTitle>
            <DialogDescription>
              Pilih salat sunnah yang ingin Anda tampilkan. Catatan yang sudah
              tersimpan tetap tersimpan saat pilihan disembunyikan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {sunnah.map((item) => (
              <button
                type="button"
                key={item.key}
                aria-pressed={activeSunnah.includes(item.key)}
                onClick={() =>
                  setActiveSunnah((previous) =>
                    previous.includes(item.key)
                      ? previous.filter((key) => key !== item.key)
                      : [...previous, item.key],
                  )
                }
                className={`min-h-11 rounded-xl border px-3 text-sm ${activeSunnah.includes(item.key) ? "border-navy-900 bg-blue-50 font-medium text-navy-900" : "border-slate-200 text-slate-600"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSunnah(false)}
              className="w-full rounded-xl"
            >
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
