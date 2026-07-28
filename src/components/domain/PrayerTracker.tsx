"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Sparkles, X } from "lucide-react";

interface PrayerTrackerProps {
  userId: string;
  onPrayerToggle?: (dateStr: string, prayerName: string, isCompleted: boolean) => void;
  externalLogs?: Record<string, boolean>;
}

const MANDATORY_PRAYERS = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

const AVAILABLE_SUNNAH_PRAYERS = [
  { key: "tahajud", label: "Sholat Tahajud" },
  { key: "dhuha", label: "Sholat Dhuha" },
  { key: "rawatib", label: "Sholat Rawatib" },
  { key: "witir", label: "Sholat Witir" },
  { key: "tarawih", label: "Sholat Tarawih" },
  { key: "hajat", label: "Sholat Hajat" },
  { key: "istikharah", label: "Sholat Istikharah" },
  { key: "taubat", label: "Sholat Taubat" },
];

// Maps prayer_name key → expected habit title in PTP Action Plan
const PRAYER_TO_HABIT_TITLE: Record<string, string> = {
  subuh: "Sholat Subuh",
  dzuhur: "Sholat Dzuhur",
  ashar: "Sholat Ashar",
  maghrib: "Sholat Maghrib",
  isya: "Sholat Isya",
  tahajud: "Sholat Tahajud",
  dhuha: "Sholat Dhuha",
  rawatib: "Sholat Rawatib",
};

const DAY_INITIALS: Record<number, string> = {
  0: "M", // Minggu
  1: "S", // Senin
  2: "S", // Selasa
  3: "R", // Rabu
  4: "K", // Kamis
  5: "J", // Jumat
  6: "S", // Sabtu
};

export function PrayerTracker({ userId, onPrayerToggle, externalLogs }: PrayerTrackerProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<Record<string, boolean>>({});
  const [activeSunnahKeys, setActiveSunnahKeys] = useState<string[]>([]);
  const [showSunnahModal, setShowSunnahModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync with external logs if provided
  useEffect(() => {
    if (externalLogs) {
      setLogs((prev) => ({ ...prev, ...externalLogs }));
    }
  }, [externalLogs]);

  // Generate last 5 days (oldest to today)
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const dateStr = d.toISOString().split("T")[0];
    const initial = DAY_INITIALS[d.getDay()];
    const isToday = i === 4;
    return { dateStr, initial, dayNum: d.getDate(), isToday };
  });

  useEffect(() => {
    async function loadPrayerData() {
      if (!userId) return;
      try {
        const startDate = days[0].dateStr;
        const endDate = days[4].dateStr;

        // Fetch logs
        const { data } = await supabase
          .from("prayer_logs")
          .select("date, prayer_name, is_completed")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate);

        if (data) {
          const logMap: Record<string, boolean> = {};
          const sunnahFound = new Set<string>();

          data.forEach((row) => {
            logMap[`${row.date}_${row.prayer_name}`] = row.is_completed;
            const isMandatory = MANDATORY_PRAYERS.some((m) => m.key === row.prayer_name);
            if (!isMandatory && row.is_completed) {
              sunnahFound.add(row.prayer_name);
            }
          });

          setLogs(logMap);
          if (sunnahFound.size > 0) {
            setActiveSunnahKeys(Array.from(sunnahFound));
          }
        }
      } catch (err) {
        console.error("Gagal memuat log sholat:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPrayerData();
  }, [userId]);

  const syncHabitLog = async (habitTitle: string, dateStr: string, completed: boolean) => {
    try {
      // Find matching active habit by title
      const { data: habit } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", userId)
        .ilike("title", habitTitle)
        .eq("is_archived", false)
        .maybeSingle();

      if (!habit) return; // No matching habit in PTP — skip

      if (completed) {
        await supabase.from("habit_logs").upsert(
          { habit_id: habit.id, user_id: userId, date: dateStr, completed: true },
          { onConflict: "habit_id,date" }
        );
      } else {
        await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habit.id)
          .eq("user_id", userId)
          .eq("date", dateStr);
      }
    } catch (err) {
      console.error("syncHabitLog error:", err);
    }
  };

  const togglePrayer = async (dateStr: string, prayerName: string) => {
    const key = `${dateStr}_${prayerName}`;
    const newStatus = !logs[key];

    setLogs((prev) => ({ ...prev, [key]: newStatus }));

    // Notify parent dashboard immediately (realtime)
    if (onPrayerToggle) {
      onPrayerToggle(dateStr, prayerName, newStatus);
    }

    try {
      if (newStatus) {
        await supabase.from("prayer_logs").upsert(
          {
            user_id: userId,
            date: dateStr,
            prayer_name: prayerName,
            is_completed: true,
          },
          { onConflict: "user_id,date,prayer_name" }
        );
      } else {
        await supabase
          .from("prayer_logs")
          .delete()
          .eq("user_id", userId)
          .eq("date", dateStr)
          .eq("prayer_name", prayerName);
      }

      // Sync to habit_logs if this prayer maps to a PTP habit (today only)
      const todayStr = new Date().toISOString().split("T")[0];
      if (dateStr === todayStr && PRAYER_TO_HABIT_TITLE[prayerName]) {
        await syncHabitLog(PRAYER_TO_HABIT_TITLE[prayerName], dateStr, newStatus);
      }
    } catch (err) {
      console.error("Gagal update sholat:", err);
      setLogs((prev) => ({ ...prev, [key]: !newStatus }));
      if (onPrayerToggle) {
        onPrayerToggle(dateStr, prayerName, !newStatus);
      }
    }
  };

  const toggleSunnahActive = (key: string) => {
    if (activeSunnahKeys.includes(key)) {
      setActiveSunnahKeys(activeSunnahKeys.filter((k) => k !== key));
    } else {
      setActiveSunnahKeys([...activeSunnahKeys, key]);
    }
  };

  const activeSunnahList = AVAILABLE_SUNNAH_PRAYERS.filter((s) => activeSunnahKeys.includes(s.key));

  return (
    <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-warm-border/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center font-bold shrink-0 border border-amber-200">
            <svg className="h-4 w-4 fill-amber-700 text-amber-700" viewBox="0 0 24 24">
              <path d="M12 2L10 5H14L12 2ZM12 6C9 6 7 8 7 11V22H17V11C17 8 15 6 12 6ZM12 8C13.66 8 15 9.34 15 11V20H9V11C9 9.34 10.34 8 12 8ZM11 14H13V18H11V14Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm text-navy-900 leading-snug">Tracking Sholat</h3>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSunnahModal(true)}
          className="text-xs h-7.5 px-2.5 gap-1 font-bold text-amber-900 border-amber-300 bg-amber-50/50 hover:bg-amber-100 rounded-xl shrink-0"
        >
          <Plus className="h-3.5 w-3.5 text-amber-600" />
          <span>Tambah Sunnah</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Memuat tracking sholat...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left font-bold text-slate-700 py-2 pr-2">Sholat</th>
                {days.map((d) => (
                  <th key={d.dateStr} className={`text-center font-bold py-2 px-1 w-9 ${d.isToday ? "text-amber-900" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                        d.isToday ? "bg-amber-500 text-white font-extrabold shadow-2xs" : "bg-slate-100 text-slate-700"
                      }`}>
                        {d.initial}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal mt-0.5">{d.dayNum}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MANDATORY_PRAYERS.map((p) => (
                <tr key={p.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-2 font-bold text-navy-900">
                    {p.label}
                  </td>
                  {days.map((d) => {
                    const isChecked = !!logs[`${d.dateStr}_${p.key}`];
                    return (
                      <td key={d.dateStr} className="text-center py-2.5 px-1 w-9">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => togglePrayer(d.dateStr, p.key)}
                          className="h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white mx-auto"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* SHOLAT SUNNAH (Pilihan User) */}
              {activeSunnahList.length > 0 && (
                <>
                  <tr className="bg-amber-50/50">
                    <td colSpan={6} className="py-1.5 px-2 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                      Sunnah Pilihan
                    </td>
                  </tr>
                  {activeSunnahList.map((p) => (
                    <tr key={p.key} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-2 font-semibold text-slate-800 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="truncate text-xs">{p.label}</span>
                        </div>
                        <button
                          onClick={() => toggleSunnahActive(p.key)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded-md hover:bg-slate-100 shrink-0"
                          title="Hapus dari display"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                      {days.map((d) => {
                        const isChecked = !!logs[`${d.dateStr}_${p.key}`];
                        return (
                          <td key={d.dateStr} className="text-center py-2 px-1 w-9">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => togglePrayer(d.dateStr, p.key)}
                              className="h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white mx-auto"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Pilih Sholat Sunnah */}
      <Dialog open={showSunnahModal} onOpenChange={setShowSunnahModal}>
        <DialogContent className="max-w-sm p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-navy-900 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Pilih Sholat Sunnah</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Centang sholat sunnah yang ingin Anda tampilkan di tabel tracking:
            </p>
            <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
              {AVAILABLE_SUNNAH_PRAYERS.map((s) => {
                const isSelected = activeSunnahKeys.includes(s.key);
                return (
                  <div
                    key={s.key}
                    onClick={() => toggleSunnahActive(s.key)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs">{s.label}</span>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSunnahActive(s.key)}
                      className="h-4 w-4 rounded-md border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowSunnahModal(false)}
              className="bg-navy-900 text-white font-bold text-xs w-full rounded-xl"
            >
              Selesai & Tampilkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
