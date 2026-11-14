import { addCalendarDays } from "./local-date";

export type ExecutionHabit = {
  id: string;
  area: string;
  quantity: number;
  frequency: string;
  weekdays?: number[];
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};
export type ExecutionLog = {
  habit_id: string;
  date: string;
  activity_date?: string | null;
  completed?: boolean;
  completed_count?: number | null;
  is_canonical_occurrence?: boolean;
};

type AreaExecution = { score: number | null; scheduled: number; completed: number; unsupported: number };

export function calculateExecution(input: {
  startDate: string; endDate: string; areas: string[]; habits: ExecutionHabit[]; logs: ExecutionLog[];
}) {
  const areas = [...new Set(input.areas)];
  const habits = input.habits.filter(habit => areas.includes(habit.area));
  const dayOfWeek = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
  const monday = (date: string) => addCalendarDays(date, 1 - dayOfWeek(date));
  const frequency = (habit: ExecutionHabit) => {
    const value = habit.frequency.trim().toLowerCase();
    if (["daily", "harian", "setiap hari"].includes(value)) return "daily";
    if (["weekly", "pekanan"].includes(value) || value.includes("minggu") || value.includes("pekan")) return "weekly";
    if (value === "custom" && habit.weekdays?.length && habit.weekdays.every(day => Number.isInteger(day) && day >= 1 && day <= 7)) return "custom";
    return "unsupported";
  };
  const quantity = (habit: ExecutionHabit) => Number.isFinite(habit.quantity) && habit.quantity > 0 ? habit.quantity : 1;
  const logs = new Map<string, ExecutionLog>();
  for (const log of input.logs) {
    if (log.is_canonical_occurrence !== false) logs.set(`${log.habit_id}:${log.date}`, log);
  }
  const occurrences = new Map<string, Set<string>>(habits.map(habit => [habit.id, new Set()]));
  const summarize = (date: string) => {
    const result: Record<string, AreaExecution> = {};
    for (const area of areas) {
      const measured: number[] = [];
      let scheduled = 0, completed = 0, unsupported = 0;
      for (const habit of habits.filter(habit => habit.area === area)) {
        if ((habit.effectiveFrom || input.startDate) > date) continue;
        const kind = frequency(habit);
        if (kind === "unsupported") { unsupported++; continue; }
        const keys = occurrences.get(habit.id)!;
        let done = 0;
        for (const key of keys) {
          const log = logs.get(`${habit.id}:${key}`);
          const activity = log?.activity_date || log?.date;
          if (!log || !activity || activity < (habit.effectiveFrom || input.startDate)
            || activity < input.startDate || activity > date || (habit.effectiveUntil && activity > habit.effectiveUntil)) continue;
          const raw = log.completed_count == null ? (log.completed ? 1 : 0) : log.completed_count;
          done += Math.max(0, Math.min(quantity(habit), Number.isFinite(raw) ? raw : 0));
        }
        const expected = keys.size * quantity(habit);
        scheduled += expected;
        completed += done;
        if (expected > 0) measured.push(done / expected * 100);
      }
      result[area] = { score: measured.length ? measured.reduce((sum, value) => sum + value, 0) / measured.length : null, scheduled, completed, unsupported };
    }
    const measuredAreas = Object.values(result).flatMap(area => area.score === null ? [] : [area.score]);
    return { areas: result, score: measuredAreas.length ? measuredAreas.reduce((sum, value) => sum + value, 0) / measuredAreas.length : null };
  };
  const timeline: { date: string; scores: Record<string, number | null>; score: number | null }[] = [];
  const lastDate = [input.endDate, addCalendarDays(input.startDate, 89)].sort()[0];
  for (let date = input.startDate; date <= lastDate; date = addCalendarDays(date, 1)) {
    for (const habit of habits) {
      if ((habit.effectiveFrom && date < habit.effectiveFrom) || (habit.effectiveUntil && date > habit.effectiveUntil)) continue;
      const kind = frequency(habit);
      if (kind === "daily" || (kind === "custom" && habit.weekdays!.includes(dayOfWeek(date)))) occurrences.get(habit.id)!.add(date);
      if (kind === "weekly") occurrences.get(habit.id)!.add(monday(date));
    }
    const result = summarize(date);
    timeline.push({ date, score: result.score, scores: Object.fromEntries(areas.map(area => [area, result.areas[area].score])) });
  }
  const result = summarize(lastDate);
  return { ...result, timeline, scheduled: Object.values(result.areas).reduce((sum, area) => sum + area.scheduled, 0), completed: Object.values(result.areas).reduce((sum, area) => sum + area.completed, 0) };
}
