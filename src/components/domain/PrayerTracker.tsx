"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Sparkles, X, ExternalLink } from "lucide-react";
import { DEFAULT_TIME_ZONE, getHabitOccurrenceKey, getLocalDateRange, getLocalDateString, normalizeHabitFrequency } from "@/lib/local-date";

interface PrayerTrackerProps {
  userId: string;
  onPrayerToggle?: (dateStr: string, prayerName: string, isCompleted: boolean) => void;
  externalLogs?: Record<string, boolean>;
  accountCreatedDate?: string; // YYYY-MM-DD format
  timeZone?: string;
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
  0: "M", 1: "S", 2: "S", 3: "R", 4: "K", 5: "J", 6: "S",
};

export function PrayerTracker({ userId, accountCreatedDate, onPrayerToggle, externalLogs, timeZone = DEFAULT_TIME_ZONE }: PrayerTrackerProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<Record<string, boolean>>({});
  const [activeSunnahKeys, setActiveSunnahKeys] = useState<string[]>([]);
  const [showSunnahModal, setShowSunnahModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalLogs) {
      setLogs((prev) => ({ ...prev, ...externalLogs }));
    }
  }, [externalLogs]);

  useEffect(() => {
    async function loadLogs() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from("prayer_logs")
          .select("date, prayer_name, is_completed")
          .eq("user_id", userId);

        if (error) throw error;

        const map: Record<string, boolean> = {};
        const autoSunnah: string[] = [];

        (data || []).forEach((row) => {
          map[`${row.date}_${row.prayer_name}`] = row.is_completed;
          const isSunnah = AVAILABLE_SUNNAH_PRAYERS.some((s) => s.key === row.prayer_name);
          if (isSunnah && row.is_completed && !autoSunnah.includes(row.prayer_name)) {
            autoSunnah.push(row.prayer_name);
          }
        });

        setLogs((prev) => ({ ...map, ...prev }));
        if (autoSunnah.length > 0) {
          setActiveSunnahKeys((prev) => Array.from(new Set([...prev, ...autoSunnah])));
        }
      } catch (err) {
        console.error("Load prayer logs error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [userId, supabase]);

  const togglePrayer = async (dateStr: string, prayerName: string) => {
    const current = !!logs[`${dateStr}_${prayerName}`];
    const nextVal = !current;

    setLogs((prev) => ({ ...prev, [`${dateStr}_${prayerName}`]: nextVal }));
    onPrayerToggle?.(dateStr, prayerName, nextVal);

    try {
      if (nextVal) {
        const { error } = await supabase.from("prayer_logs").upsert({
          user_id: userId,
          date: dateStr,
          prayer_name: prayerName,
          is_completed: true,
        }, { onConflict: "user_id,date,prayer_name" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("prayer_logs")
          .delete()
          .eq("user_id", userId)
          .eq("date", dateStr)
          .eq("prayer_name", prayerName);
        if (error) throw error;
      }

      const todayStr = getLocalDateString(new Date(), timeZone);
      if (dateStr === todayStr) {
        const targetHabitTitle = PRAYER_TO_HABIT_TITLE[prayerName];
        if (targetHabitTitle) {
          const { data: habits, error: habitError } = await supabase
            .from("habits")
            .select("id,frequency")
            .eq("user_id", userId)
            .eq("title", targetHabitTitle);
          if (habitError) throw habitError;

          for (const habit of habits || []) {
            const occurrenceKey = getHabitOccurrenceKey(normalizeHabitFrequency(habit.frequency), new Date(), timeZone);
            if (nextVal) {
              const { error } = await supabase.from("habit_logs").upsert({
                user_id: userId,
                habit_id: habit.id,
                date: occurrenceKey,
                activity_date: todayStr,
                completed: true,
                completed_count: 1,
              }, { onConflict: "habit_id,date" });
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("habit_logs")
                .delete()
                .eq("user_id", userId)
                .eq("habit_id", habit.id)
                .eq("date", occurrenceKey);
              if (error) throw error;
            }
          }
        }
      }
    } catch (err) {
      console.error("Save prayer log error:", err);
      setLogs((prev) => ({ ...prev, [`${dateStr}_${prayerName}`]: current }));
      onPrayerToggle?.(dateStr, prayerName, current);
    }
  };

  const days = getLocalDateRange(7, timeZone).map((day) => ({
    ...day,
    initial: DAY_INITIALS[day.dayIndex],
  }));
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
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Memuat tracking sholat...</div>
      ) : (
        <div className="space-y-3">
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
                    <td className="py-2.5 pr-2 font-bold text-navy-900">{p.label}</td>
                    {days.map((d) => {
                      const isChecked = !!logs[`${d.dateStr}_${p.key}`];
                      const isLocked = !!(accountCreatedDate && d.dateStr < accountCreatedDate);
                      return (
                        <td key={d.dateStr} className="text-center py-2.5 px-1 w-9">
                          <Checkbox
                            checked={isChecked}
                            disabled={isLocked}
                            onCheckedChange={() => !isLocked && togglePrayer(d.dateStr, p.key)}
                            className={`h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white mx-auto ${
                              isLocked ? "opacity-30 cursor-not-allowed bg-slate-100" : ""
                            }`}
                            title={isLocked ? "Hari sebelum akun dibuat (terkunci)" : ""}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {activeSunnahList.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 pr-2 font-bold text-navy-900">
                      <span className="truncate text-xs">{p.label}</span>
                    </td>
                    {days.map((d) => {
                      const isChecked = !!logs[`${d.dateStr}_${p.key}`];
                      const isLocked = !!(accountCreatedDate && d.dateStr < accountCreatedDate);
                      return (
                        <td key={d.dateStr} className="text-center py-2.5 px-1 w-9">
                          <Checkbox
                            checked={isChecked}
                            disabled={isLocked}
                            onCheckedChange={() => !isLocked && togglePrayer(d.dateStr, p.key)}
                            className={`h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white mx-auto ${
                              isLocked ? "opacity-30 cursor-not-allowed bg-slate-100" : ""
                            }`}
                            title={isLocked ? "Hari sebelum akun dibuat (terkunci)" : ""}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowSunnahModal(true)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors group cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="underline underline-offset-4 decoration-amber-300 hover:decoration-amber-600">
                Tambah / Kelola Sholat Sunnah
              </span>
              <ExternalLink className="h-3 w-3 text-amber-500 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

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
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <button type="button" onClick={() => toggleSunnahActive(s.key)} className="flex-1 text-left text-xs">{s.label}</button>
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
