const DAY_MS = 86400000;

function toUtcDay(value: string | Date) {
  if (value instanceof Date) {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getProgramDay(startDate: string | Date, currentDate = new Date()) {
  return Math.max(1, Math.floor((toUtcDay(currentDate) - toUtcDay(startDate)) / DAY_MS) + 1);
}

export function getActiveProgramMonth(day: number): 1 | 2 | 3 {
  return Math.min(3, Math.ceil(Math.max(1, day) / 30)) as 1 | 2 | 3;
}

export type MonthEditState = "LOCKED_FUTURE" | "ACTIVE" | "LOCKED_PAST";

export function getMonthEditState(month: 1 | 2 | 3, day: number): MonthEditState {
  const startDay = (month - 1) * 30 + 1;
  const graceEndDay = month * 30 + 7;
  if (day < startDay) return "LOCKED_FUTURE";
  if (day > graceEndDay) return "LOCKED_PAST";
  return "ACTIVE";
}
