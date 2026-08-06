export const DEFAULT_TIME_ZONE = "Asia/Jakarta";

const TIME_ZONE_MAP: Record<string, string> = {
  WIB: "Asia/Jakarta",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",
  Auto: DEFAULT_TIME_ZONE,
};

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function isValidTimeZone(value?: string | null): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(value?: string | null): string {
  if (!value) return DEFAULT_TIME_ZONE;
  const mapped = TIME_ZONE_MAP[value] || value;
  return isValidTimeZone(mapped) ? mapped : DEFAULT_TIME_ZONE;
}

export function resolveParticipantTimeZone(
  storedTimeZone?: string | null,
  mode: "AUTO" | "MANUAL" = "AUTO"
): string {
  return mode === "AUTO" ? normalizeTimeZone(getDeviceTimeZone()) : normalizeTimeZone(storedTimeZone);
}

export function getLocalDateString(date = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addCalendarDays(dateString: string, amount: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return date.toISOString().slice(0, 10);
}

export type HabitFrequency = "daily" | "weekly";

export function normalizeHabitFrequency(value?: string | null): HabitFrequency {
  const normalized = value?.trim().toLowerCase() || "";
  return normalized === "weekly" || normalized === "pekanan" || normalized.includes("minggu") || normalized.includes("pekan") ? "weekly" : "daily";
}

export function getLocalWeekStart(date = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
  const localDate = getLocalDateString(date, timeZone);
  const dayOfWeek = new Date(`${localDate}T12:00:00Z`).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addCalendarDays(localDate, -daysSinceMonday);
}

export function getHabitOccurrenceKey(
  frequency: HabitFrequency,
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE
): string {
  return frequency === "weekly" ? getLocalWeekStart(date, timeZone) : getLocalDateString(date, timeZone);
}

export function getLocalDateRange(days: number, timeZone = DEFAULT_TIME_ZONE, now = new Date()) {
  const today = getLocalDateString(now, timeZone);
  return Array.from({ length: days }, (_, index) => {
    const dateStr = addCalendarDays(today, index - days + 1);
    const date = new Date(`${dateStr}T12:00:00Z`);
    return {
      dateStr,
      dayNum: Number(dateStr.slice(8, 10)),
      dayIndex: date.getUTCDay(),
      isToday: dateStr === today,
    };
  });
}

export function getTimeZoneLabel(timeZone: string): string {
  const normalized = normalizeTimeZone(timeZone);
  if (normalized === "Asia/Jakarta") return "WIB";
  if (normalized === "Asia/Makassar") return "WITA";
  if (normalized === "Asia/Jayapura") return "WIT";
  return normalized;
}
