const DAY_MS = 86400000;

export type ProgramMonth = 1 | 2 | 3;

export interface ProgramMonthWindow {
  startDay: number;
  dueDay: number;
  graceEndDay: number;
  lockDay: number;
}

export type ProgramMonthPhase = "LOCKED_FUTURE" | "OPEN" | "DUE" | "GRACE" | "MATURE";

export function getProgramMonthWindow(month: ProgramMonth): ProgramMonthWindow {
  const startDay = (month - 1) * 30 + 1;
  const dueDay = month * 30;
  const graceEndDay = dueDay + 7;
  return { startDay, dueDay, graceEndDay, lockDay: graceEndDay + 1 };
}

function toUtcDay(value: string | Date) {
  if (value instanceof Date) {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getProgramDay(startDate: string | Date, currentDate = new Date()) {
  return Math.max(0, Math.floor((toUtcDay(currentDate) - toUtcDay(startDate)) / DAY_MS) + 1);
}

export function getActiveProgramMonth(day: number): ProgramMonth | null {
  if (day < 1) return null;
  return Math.min(3, Math.ceil(day / 30)) as ProgramMonth;
}

export type MonthEditState = "LOCKED_FUTURE" | "ACTIVE" | "LOCKED_PAST";

export function getProgramMonthPhase(month: ProgramMonth, day: number): ProgramMonthPhase {
  const { startDay, dueDay, graceEndDay } = getProgramMonthWindow(month);
  if (day < startDay) return "LOCKED_FUTURE";
  if (day < dueDay) return "OPEN";
  if (day === dueDay) return "DUE";
  if (day <= graceEndDay) return "GRACE";
  return "MATURE";
}

export function getMonthEditState(month: ProgramMonth, day: number): MonthEditState {
  const phase = getProgramMonthPhase(month, day);
  if (phase === "LOCKED_FUTURE") return "LOCKED_FUTURE";
  if (phase === "MATURE") return "LOCKED_PAST";
  return "ACTIVE";
}
