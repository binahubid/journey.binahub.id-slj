"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { addCalendarDays, getLocalDateString, getTimeZoneLabel } from "@/lib/local-date";
import { getUpcomingPrayer, prayerTimesUrl, readPrayerSchedule } from "@/lib/prayer-times";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type AdaptiveJourneyHeroProps = {
  name: string;
  location: string;
  timeZone: string;
  day: number;
  totalDays: number;
  summary: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
};

export function AdaptiveJourneyHero({ name, location, timeZone, day, totalDays, summary, actions, notice }: AdaptiveJourneyHeroProps) {
  const [clock, setClock] = useState<Date | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [prayerSchedule, setPrayerSchedule] = useState<{
    city: string;
    zone: string;
    date: string;
    today: ReturnType<typeof readPrayerSchedule>;
    tomorrow: ReturnType<typeof readPrayerSchedule>;
  } | null>(null);
  const [prayerLoadFailed, setPrayerLoadFailed] = useState(false);
  const [prayerRetry, setPrayerRetry] = useState(0);
  const heroPrayerDate = clock ? getLocalDateString(clock, timeZone) : "";
  const [hour, minute, second] = clock
    ? new Intl.DateTimeFormat("en-GB", { timeZone: timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(clock).split(":")
    : ["--", "--", "00"];
  const localHour = Number(hour);
  const heroClockMain = `${hour}:${minute}`;
  const heroClockSeconds = second;
  const timeZoneStr = getTimeZoneLabel(timeZone);
  const heroDate = clock?.toLocaleDateString("id-ID", {
    timeZone: timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }) || "";
  const totalMinutes = localHour * 60 + Number(minute);
  const adaptiveHeroBgImage = totalMinutes >= 240 && totalMinutes < 360 ? "/fajar.webp"
    : totalMinutes >= 360 && totalMinutes < 660 ? "/pagi.webp"
    : totalMinutes >= 660 && totalMinutes < 900 ? "/siang.webp"
    : totalMinutes >= 900 && totalMinutes < 1080 ? "/sore.webp"
    : totalMinutes >= 1080 && totalMinutes < 1170 ? "/petang.webp"
    : "/malam.webp";

  // A schedule from a previous location or local date must not drive the timer.
  const matchingSchedule = prayerSchedule?.city === location && prayerSchedule.zone === timeZone
    ? prayerSchedule
    : null;
  const localSeconds = totalMinutes * 60 + Number(second);
  const nextPrayerInfo = matchingSchedule?.date === heroPrayerDate
    ? getUpcomingPrayer(matchingSchedule.today, matchingSchedule.tomorrow, localSeconds)
    : matchingSchedule && addCalendarDays(matchingSchedule.date, 1) === heroPrayerDate
      ? getUpcomingPrayer(matchingSchedule.tomorrow, [], localSeconds)
      : null;

  // Map prayer name to custom WebP icon
  const prayerIconMap: Record<string, string> = {
    Subuh: "/icon_subuh.webp",
    Dzuhur: "/icon_dzuhur.webp",
    Ashar: "/icon_ashar.webp",
    Maghrib: "/icon_maghrib.webp",
    Isya: "/icon_isya.webp",
  };

  useEffect(() => {
    const tick = () => setClock(new Date());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!heroPrayerDate) return;
    const controller = new AbortController();
    setPrayerLoadFailed(false);

    async function getSchedule(date: string) {
      const response = await fetch(prayerTimesUrl(location, date, timeZone), {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Jadwal salat belum tersedia.");
      const result = await response.json();
      return readPrayerSchedule(result?.data?.timings);
    }

    void Promise.allSettled([
      getSchedule(heroPrayerDate),
      getSchedule(addCalendarDays(heroPrayerDate, 1)),
    ]).then(([today, tomorrow]) => {
      if (controller.signal.aborted) return;
      setPrayerLoadFailed(today.status === "rejected" || tomorrow.status === "rejected");
      setPrayerSchedule({
        city: location,
        zone: timeZone,
        date: heroPrayerDate,
        today: today.status === "fulfilled" ? today.value : [],
        tomorrow: tomorrow.status === "fulfilled" ? tomorrow.value : [],
      });
    });
    return () => controller.abort();
  }, [location, timeZone, heroPrayerDate, prayerRetry]);

  return (
    <>
        <div
          data-testid="adaptive-journey-hero" role="region" aria-label="Ringkasan hari ini dan jadwal salat" className="relative rounded-3xl overflow-hidden text-white p-4 sm:p-8 lg:p-10 shadow-sm border border-white/15 aspect-auto lg:aspect-[16/9] w-full flex flex-col justify-between bg-cover bg-center min-h-[400px] sm:min-h-[440px]"
          style={{ backgroundImage: `url('${adaptiveHeroBgImage}')` }}
        >
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/60 pointer-events-none"></div>

          {/* TOP ROW: Greeting (Top-Left) & Next Prayer (Top-Right) */}
          <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-3 lg:gap-4">
            {/* Left: Day badge (TOP) & Assalamu'alaikum Greeting (BOTTOM) */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-amber-900 font-extrabold bg-amber-400/90 px-2.5 py-0.5 rounded-full text-xs sm:text-xs shadow-2xs whitespace-nowrap">
                  {day > 0 ? `Hari ke-${day} dari ${totalDays}` : "Program belum dimulai"}
                </span>
                {actions}

                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-amber-300 hover:bg-white/10 transition-colors"
                  aria-label="Buka jam layar penuh" title="Aktifkan Mode Fullscreen"
                >
                  <Maximize2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>

              {notice}

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight pt-0.5">
                Assalamu&apos;alaikum, {name.split(" ")[0]}!
              </h1>
            </div>

            {/* Next prayer sits below the greeting on mobile. */}
            <div className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-white/20 bg-black/35 p-3 backdrop-blur-md lg:w-64 lg:shrink-0" aria-label="Jadwal salat berikutnya" role="region">
              {nextPrayerInfo ? (
                <>
                  <img
                    src={prayerIconMap[nextPrayerInfo.name] || "/icon_subuh.webp"}
                    alt=""
                    className="h-11 w-8 shrink-0 object-contain sm:h-14 sm:w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white/85">{nextPrayerInfo.isGracePeriod ? "Waktu salat tiba" : "Salat berikutnya"}</p>
                    <p className="mt-0.5 text-base font-semibold text-white sm:text-lg">{nextPrayerInfo.name}</p>
                    <p className="text-sm font-semibold tabular-nums text-amber-200">{nextPrayerInfo.time}</p>
                  </div>
                  {!nextPrayerInfo.isGracePeriod && (
                    <div className="relative flex shrink-0 flex-col items-end justify-center sm:size-14 sm:items-center">
                      <svg aria-hidden="true" className="absolute inset-0 hidden -rotate-90 sm:block" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - nextPrayerInfo.progress / 100)} />
                      </svg>
                      <span className="relative whitespace-nowrap text-sm font-semibold leading-tight tabular-nums text-amber-100 sm:px-1 sm:text-center sm:text-xs">
                        {nextPrayerInfo.text}
                      </span>
                      <span className="mt-0.5 text-xs leading-tight text-white/85 sm:sr-only">sisa waktu</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div>
                    <p className="text-xs font-medium text-white/85">Salat berikutnya</p>
                    <p role="status" className="mt-1 text-sm font-medium">{prayerLoadFailed ? "Jadwal belum tersedia" : "Memuat jadwal salat"}</p>
                  </div>
                  {prayerLoadFailed && <button type="button" onClick={() => setPrayerRetry(retry => retry + 1)} className="min-h-11 text-sm font-semibold text-amber-200 underline underline-offset-4">Coba lagi</button>}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ROW: Digital Clock (Bottom-Left) & Progress Card (Bottom-Right) */}
          <div className="relative z-10 flex flex-row items-end justify-between gap-2 lg:gap-6 mt-auto pt-3">
            {/* Left: Big Clock + small seconds/WIB beside it */}
            <div className="space-y-0.5 sm:space-y-1.5 pb-0.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
                <span className="text-[2.5rem] min-[375px]:text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-semibold text-white font-mono tracking-tighter leading-none">
                  {heroClockMain}
                </span>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1">
                  <span className="text-xs sm:text-sm font-mono font-bold text-white/80">:{heroClockSeconds}</span>
                  <span className="text-xs font-medium text-white/90">{timeZoneStr}</span>
                </div>
              </div>
              <span className="text-xs sm:text-base font-medium text-amber-100 block">{heroDate}</span>
            </div>

            {summary}
          </div>
        </div>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent
          className="inset-0 left-0 top-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col justify-between rounded-none border-0 bg-black bg-cover bg-center p-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-white sm:p-12 [&>button]:text-white [&>button]:hover:bg-white/10"
          style={{ backgroundImage: `url('${adaptiveHeroBgImage}')` }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />
          <DialogTitle className="relative z-10 pr-12 text-base font-semibold">Jam layar penuh · Hari {day} dari {totalDays}</DialogTitle>
          <div className="relative z-10 my-auto space-y-3 text-center">
            <p className="font-mono text-6xl font-semibold leading-none tracking-tighter sm:text-9xl md:text-[12rem]">{heroClockMain}</p>
            <p className="text-xl font-medium text-amber-200 sm:text-3xl">:{heroClockSeconds} · {timeZoneStr}</p>
            <p className="text-sm text-white/90 sm:text-lg">{heroDate}</p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5">
            {nextPrayerInfo ? (
              <>
                <div>
                  <p className="text-sm text-white/85">{nextPrayerInfo.isGracePeriod ? "Waktu salat tiba" : "Salat berikutnya"}</p>
                  <p className="mt-1 text-lg font-semibold">{nextPrayerInfo.name} · {nextPrayerInfo.time}</p>
                </div>
                {!nextPrayerInfo.isGracePeriod && <p className="text-lg font-semibold tabular-nums text-amber-200">{nextPrayerInfo.text}</p>}
              </>
            ) : <p>{prayerLoadFailed ? "Jadwal salat belum tersedia" : "Memuat jadwal salat"}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
