const LESSON_SEPARATOR = "--- Pelajaran: ---";
const IMPROVEMENT_SEPARATOR = "--- Perbaikan Besok: ---";

export function parseJournalContent(content: string | null | undefined) {
  const value = content?.trim() || "";
  const [reflectionPart, lessonAndImprovement = ""] = value.split(LESSON_SEPARATOR, 2);
  const [lessonPart, improvementPart = ""] = lessonAndImprovement.split(IMPROVEMENT_SEPARATOR, 2);

  return {
    reflection: reflectionPart.trim(),
    lesson: lessonPart.trim(),
    improvement: improvementPart.trim(),
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
  return Math.max(1, Math.floor((entry.getTime() - start.getTime()) / 86400000) + 1);
}

export function getJournalStreak(dates: string[]) {
  const uniqueDates = [...new Set(dates.map(date => date.slice(0, 10)))].sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(`${uniqueDates[0]}T00:00:00`);
  const daysSinceLatest = Math.round((today.getTime() - latest.getTime()) / 86400000);
  if (daysSinceLatest > 1) return 0;

  let streak = 1;
  let previous = latest;
  for (const date of uniqueDates.slice(1)) {
    const current = new Date(`${date}T00:00:00`);
    const difference = Math.round((previous.getTime() - current.getTime()) / 86400000);
    if (difference !== 1) break;
    streak += 1;
    previous = current;
  }
  return streak;
}
