export { getPrayerLocation, prayerTimesUrl, zonedMinutes } from "../../supabase/functions/_shared/prayer-location";

const prayerNames = [
  ["Fajr", "Subuh"],
  ["Dhuhr", "Dzuhur"],
  ["Asr", "Ashar"],
  ["Maghrib", "Maghrib"],
  ["Isha", "Isya"],
] as const;

type Prayer = { name: string; time: string; secs: number };

export function readPrayerSchedule(timings: Record<string, unknown> | null | undefined): Prayer[] {
  return prayerNames.map(([key, name]) => {
    const value = timings?.[key];
    const time = typeof value === "string" ? value.slice(0, 5) : "";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Jadwal salat tidak lengkap.");
    const [hour, minute] = time.split(":").map(Number);
    return { name, time, secs: hour * 3600 + minute * 60 };
  });
}

export function getUpcomingPrayer(today: Prayer[], tomorrow: Prayer[], localSeconds: number) {
  const daySeconds = 86_400;
  const current = today.find(prayer => localSeconds >= prayer.secs && localSeconds < prayer.secs + 180);
  if (current) return { ...current, isGracePeriod: true, text: "", progress: 100 };

  const nextIndex = today.findIndex(prayer => prayer.secs > localSeconds);
  const next = nextIndex < 0 ? tomorrow[0] : today[nextIndex];
  if (!next || today.length === 0) return null;

  const target = next.secs + (nextIndex < 0 ? daySeconds : 0);
  const previous = nextIndex > 0
    ? today[nextIndex - 1].secs
    : today[today.length - 1].secs - (nextIndex === 0 ? daySeconds : 0);
  const secondsLeft = target - localSeconds;
  const minutesLeft = Math.floor(secondsLeft / 60);
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  const text = minutesLeft < 1 ? "<1m" : hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m`;
  const progress = Math.min(100, Math.max(0, Math.round(secondsLeft / (target - previous) * 100)));
  return { ...next, isGracePeriod: false, text, progress };
}
