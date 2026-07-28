"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Sparkles, Compass } from "lucide-react";

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface LiveClockPrayerWidgetProps {
  location?: string;
  timeFormat?: "24" | "12";
  timezone?: string;
}

function parseMinutes(timeStr: string): number {
  if (!timeStr || timeStr === "--:--") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatCountdown(minutesLeft: number): string {
  if (minutesLeft <= 0) return "Sekarang!";
  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  if (hours > 0) {
    return `${hours} jam ${mins} menit lagi`;
  }
  return `${mins} menit lagi`;
}

export function LiveClockPrayerWidget({
  location = "Jakarta",
  timeFormat = "24",
  timezone = "Auto",
}: LiveClockPrayerWidgetProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [timings, setTimings] = useState<PrayerTimes>({
    Fajr: "--:--",
    Dhuhr: "--:--",
    Asr: "--:--",
    Maghrib: "--:--",
    Isha: "--:--",
  });
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; minutesLeft: number }>({
    name: "Subuh",
    time: "--:--",
    minutesLeft: 0,
  });
  const [loading, setLoading] = useState(true);

  // Live 1-second clock
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Prayer Times
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
            Dhuhr: data.data.timings.Dhuhr?.replace(/\s*\(.*\)/, "") || "--:--",
            Asr: data.data.timings.Asr?.replace(/\s*\(.*\)/, "") || "--:--",
            Maghrib: data.data.timings.Maghrib?.replace(/\s*\(.*\)/, "") || "--:--",
            Isha: data.data.timings.Isha?.replace(/\s*\(.*\)/, "") || "--:--",
          };
          setTimings(fetched);
        }
      } catch (err) {
        console.error("Gagal memuat jadwal sholat:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrayerTimes();
  }, [location]);

  // Recalculate next prayer & countdown
  useEffect(() => {
    if (!now || timings.Fajr === "--:--") return;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: "Subuh", time: timings.Fajr, mins: parseMinutes(timings.Fajr) },
      { name: "Dzuhur", time: timings.Dhuhr, mins: parseMinutes(timings.Dhuhr) },
      { name: "Ashar", time: timings.Asr, mins: parseMinutes(timings.Asr) },
      { name: "Maghrib", time: timings.Maghrib, mins: parseMinutes(timings.Maghrib) },
      { name: "Isya", time: timings.Isha, mins: parseMinutes(timings.Isha) },
    ];

    let found = false;
    for (const p of prayers) {
      if (p.mins > currentMinutes) {
        setNextPrayer({
          name: p.name,
          time: p.time,
          minutesLeft: p.mins - currentMinutes,
        });
        found = true;
        break;
      }
    }

    if (!found) {
      // After Isha — next prayer is tomorrow's Subuh
      const subuhMins = parseMinutes(timings.Fajr);
      const minutesUntilMidnight = 24 * 60 - currentMinutes;
      setNextPrayer({
        name: "Subuh (Besok)",
        time: timings.Fajr,
        minutesLeft: minutesUntilMidnight + subuhMins,
      });
    }
  }, [now, timings]);

  // Format Time Label
  const timeString = now
    ? timeFormat === "12"
      ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      : now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";

  const dateString = now
    ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "...";

  // Timezone label
  let tzLabel = timezone;
  if (timezone === "Auto") {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tzName.includes("Jakarta")) tzLabel = "WIB";
    else if (tzName.includes("Makassar")) tzLabel = "WITA";
    else if (tzName.includes("Jayapura")) tzLabel = "WIT";
    else tzLabel = "WIB";
  }

  return (
    <Card className="bg-gradient-to-br from-navy-900 via-navy-800 to-[#0F2847] text-white p-5 rounded-2xl shadow-md space-y-4 border border-navy-700 relative overflow-hidden flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10 relative">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300">Waktu & Waktu Sholat</h3>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-amber-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
          <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
          <span className="font-bold text-[11px]">{location}</span>
          <span className="text-[10px] text-amber-300/70">({tzLabel})</span>
        </div>
      </div>

      <div className="space-y-3 z-10 relative">
        {/* Real-time Clock */}
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {timeString}
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase">{tzLabel}</span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-0.5">{dateString}</p>
        </div>

        {/* Next Prayer Countdown Pill */}
        <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 backdrop-blur-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Sholat Berikutnya:</span>
            </span>
            <span className="font-bold text-white bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-md text-[11px]">
              {nextPrayer.name} ({loading ? "--:--" : nextPrayer.time})
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-300 font-medium">Menuju {nextPrayer.name}:</span>
            <span className="text-xs font-extrabold text-amber-400 tracking-wide">
              {loading ? "Menghitung..." : formatCountdown(nextPrayer.minutesLeft)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
