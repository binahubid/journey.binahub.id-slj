import { DEFAULT_TIME_ZONE, getLocalDateString } from "./local-date";

const DAY_MS = 86400000;

export type ProgramMonth = 1 | 2 | 3;

export interface ProgramMonthWindow {
  startDay: number;
  dueDay: number;
  graceEndDay: number;
  lockDay: number;
}

export type ProgramMonthPhase = "LOCKED_FUTURE" | "OPEN" | "DUE" | "GRACE" | "MATURE";

export function getProgramMonthWindow(month: ProgramMonth, periodDays = 30, graceDays = 7): ProgramMonthWindow {
  const startDay = (month - 1) * periodDays + 1;
  const dueDay = month * periodDays;
  const graceEndDay = dueDay + graceDays;
  return { startDay, dueDay, graceEndDay, lockDay: graceEndDay + 1 };
}

function toUtcDay(value: string | Date, timeZone: string) {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : getLocalDateString(new Date(value), timeZone);
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getProgramDay(startDate: string | Date, currentDate = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  return Math.max(0, Math.floor((toUtcDay(currentDate, timeZone) - toUtcDay(startDate, timeZone)) / DAY_MS) + 1);
}

export function getActiveProgramMonth(day: number, periodDays = 30, periodCount = 3): ProgramMonth | null {
  if (day < 1) return null;
  return Math.min(periodCount, Math.ceil(day / periodDays)) as ProgramMonth;
}

export type MonthEditState = "LOCKED_FUTURE" | "ACTIVE" | "LOCKED_PAST";

export function getProgramMonthPhase(month: ProgramMonth, day: number, periodDays = 30, graceDays = 7): ProgramMonthPhase {
  const { startDay, dueDay, graceEndDay } = getProgramMonthWindow(month, periodDays, graceDays);
  if (day < startDay) return "LOCKED_FUTURE";
  if (day < dueDay) return "OPEN";
  if (day === dueDay) return "DUE";
  if (day <= graceEndDay) return "GRACE";
  return "MATURE";
}

export function getMonthEditState(month: ProgramMonth, day: number, periodDays = 30, graceDays = 7): MonthEditState {
  const phase = getProgramMonthPhase(month, day, periodDays, graceDays);
  if (phase === "LOCKED_FUTURE") return "LOCKED_FUTURE";
  if (phase === "MATURE") return "LOCKED_PAST";
  return "ACTIVE";
}
