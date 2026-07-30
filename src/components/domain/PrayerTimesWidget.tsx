"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, ChevronRight, Sun, Moon, Sunrise, Sunset } from "lucide-react";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerTimesWidgetProps {
  location?: string;
  onViewAll?: () => void;
}

function parseTime(timeStr: string): number {
  if (!timeStr || timeStr === "--:--") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getNextPrayerInfo(timings: PrayerTimes): { name: string; time: string; remainingText: string } {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const list = [
    { name: "Subuh", time: timings.Fajr },
    { name: "Dzuhur", time: timings.Dhuhr },
    { name: "Ashar", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isya", time: timings.Isha },
  ];

  for (const p of list) {
    const mins = parseTime(p.time);
    if (mins > currentMinutes) {
      const left = mins - currentMinutes;
      const hrs = Math.floor(left / 60);
      const m = left % 60;
      const remainingText = hrs > 0 ? `${hrs}h ${m}m lagi` : `${m}m lagi`;
      return { name: p.name, time: p.time, remainingText };
    }
  }

  // Next is Subuh tomorrow
  const left = 24 * 60 - currentMinutes + parseTime(timings.Fajr);
  const hrs = Math.floor(left / 60);
  const m = left % 60;
  return { name: "Subuh", time: timings.Fajr, remainingText: `${hrs}h ${m}m lagi` };
}

export function PrayerTimesWidget({ location = "Jakarta", onViewAll }: PrayerTimesWidgetProps) {
  const [timings, setTimings] = useState<PrayerTimes>({
    Fajr: "--:--",
    Sunrise: "--:--",
    Dhuhr: "--:--",
    Asr: "--:--",
    Maghrib: "--:--",
    Isha: "--:--",
  });
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remainingText: string }>({
    name: "Subuh",
    time: "--:--",
    remainingText: "Menghitung...",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(location)}&country=Indonesia&method=11`
        );
        const data = await res.json();
        if (data?.data?.timings) {
          const fetched: PrayerTimes = {
            Fajr: data.data.timings.Fajr?.replace(/\s*\(.*\)/, "") || "--:--",
            Sunrise: data.data.timings.Sunrise?.replace(/\s*\(.*\)/, "") || "--:--",
            Dhuhr: data.data.timings.Dhuhr?.replace(/\s*\(.*\)/, "") || "--:--",
            Asr: data.data.timings.Asr?.replace(/\s*\(.*\)/, "") || "--:--",
            Maghrib: data.data.timings.Maghrib?.replace(/\s*\(.*\)/, "") || "--:--",
            Isha: data.data.timings.Isha?.replace(/\s*\(.*\)/, "") || "--:--",
          };
          setTimings(fetched);
          setNextPrayer(getNextPrayerInfo(fetched));
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchPrayerTimes();
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timings.Fajr !== "--:--") {
        setNextPrayer(getNextPrayerInfo(timings));
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [timings]);

  const prayers = [
    { name: "Subuh", time: timings.Fajr, icon: Sunrise },
    { name: "Syuruq", time: timings.Sunrise, icon: Sun, isInfo: true },
    { name: "Dzuhur", time: timings.Dhuhr, icon: Sun },
    { name: "Ashar", time: timings.Asr, icon: Sun },
    { name: "Maghrib", time: timings.Maghrib, icon: Sunset },
    { name: "Isya", time: timings.Isha, icon: Moon },
  ];

  return (
    <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-border/60 pb-3">
          <h3 className="font-extrabold text-navy-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-600" />
            Jadwal Sholat Hari Ini
          </h3>
          <div className="flex items-center space-x-1 text-[11px] text-gray-500 font-semibold bg-warm-bg px-2.5 py-1 rounded-full border border-warm-border">
            <MapPin className="h-3 w-3 text-amber-600" />
            <span>{location}</span>
          </div>
        </div>

        {/* Active Next Prayer Highlight Card */}
        <div className="bg-gradient-to-r from-navy-900 to-[#1E2E4F] text-white p-3.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Sunrise className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block">
                {nextPrayer.name === "Subuh" ? "Subuh" : nextPrayer.name}
              </span>
              <span className="text-base font-black tracking-tight">{loading ? "..." : nextPrayer.time}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-1 rounded-md border border-amber-300/30">
              {nextPrayer.remainingText}
            </span>
          </div>
        </div>

        {/* Remaining Prayer List */}
        <div className="space-y-1.5 pt-1">
          {prayers.map((p, idx) => {
            const isNext = p.name === nextPrayer.name;
            const isInfoOnly = (p as any).isInfo;
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  isInfoOnly
                    ? "text-rose-600 bg-rose-50/60 border border-rose-100/80"
                    : isNext
                    ? "bg-amber-50/80 text-navy-900 border border-amber-200/80 font-bold"
                    : "text-slate-600 hover:bg-warm-bg/70"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`h-3.5 w-3.5 ${isInfoOnly ? "text-rose-500" : isNext ? "text-amber-600" : "text-slate-400"}`} />
                  <span>{p.name}</span>
                  {isInfoOnly && <span className="text-[9px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">Terbit</span>}
                </div>
                <span className={isInfoOnly ? "text-rose-600 font-bold" : isNext ? "text-navy-900 font-bold" : "text-slate-500"}>
                  {loading ? "--:--" : p.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer link */}
      <div className="pt-3 border-t border-warm-border/60">
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-navy-900 hover:text-amber-700 flex items-center gap-1 transition-colors w-full justify-between"
        >
          <span>Lihat Semua Jadwal</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
