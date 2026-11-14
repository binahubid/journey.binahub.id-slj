const LESSON_SEPARATOR = "--- Pelajaran: ---";
const IMPROVEMENT_SEPARATOR = "--- Perbaikan Besok: ---";
const DAY_MS = 86_400_000;

export function getCanonicalJournalDate(value: string | null | undefined): string {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || "";
}

export function parseJournalContent(content: string | null | undefined) {
  const value = content?.trim() || "";
  const improvementIndex = value.indexOf(IMPROVEMENT_SEPARATOR);
  const beforeImprovement = improvementIndex === -1 ? value : value.slice(0, improvementIndex);
  const improvement = improvementIndex === -1 ? "" : value.slice(improvementIndex + IMPROVEMENT_SEPARATOR.length);
  const [reflection = "", lesson = ""] = beforeImprovement.split(LESSON_SEPARATOR, 2);

  return {
    reflection: reflection.trim(),
    lesson: lesson.trim(),
    improvement: improvement.trim(),
  };
}

export function composeJournalContent(reflection: string, lesson: string, improvement: string) {
  let content = reflection.trim();
  if (lesson.trim()) content += `\n\n${LESSON_SEPARATOR}\n${lesson.trim()}`;
  if (improvement.trim()) content += `\n\n${IMPROVEMENT_SEPARATOR}\n${improvement.trim()}`;
  return content;
}

export function getJourneyDayForDate(date: string, startDate?: string | null) {
  if (!startDate) return 1;
  const entry = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00Z`);
  return Math.max(1, Math.floor((entry.getTime() - start.getTime()) / DAY_MS) + 1);
}

export function getJournalStreak(dates: string[], today: string) {
  const uniqueDates = [...new Set(dates.map(getCanonicalJournalDate).filter(date => date && date <= today))].sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const latest = Date.parse(`${uniqueDates[0]}T00:00:00Z`);
  const daysSinceLatest = (Date.parse(`${today}T00:00:00Z`) - latest) / DAY_MS;
  if (daysSinceLatest > 1) return 0;

  let streak = 1;
  let previous = latest;
  for (const date of uniqueDates.slice(1)) {
    const current = Date.parse(`${date}T00:00:00Z`);
    const difference = (previous - current) / DAY_MS;
    if (difference !== 1) break;
    streak += 1;
    previous = current;
  }
  return streak;
}
