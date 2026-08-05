export type HabitCategory = "prayer" | "quran" | "hadith" | "general";

const normalizeTitle = (value: string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function getPrayerKeyFromHabitTitle(title: string): string | null {
  const value = normalizeTitle(title);
  if (value.includes("subuh")) return "subuh";
  if (value.includes("dzuhur") || value.includes("zuhur")) return "dzuhur";
  if (value.includes("ashar") || value.includes("asar")) return "ashar";
  if (value.includes("maghrib")) return "maghrib";
  if (value.includes("isya")) return "isya";
  if (value.includes("tahajud")) return "tahajud";
  if (value.includes("dhuha") || value.includes("duha")) return "dhuha";
  if (value.includes("rawatib")) return "rawatib";
  if (value.includes("witir")) return "witir";
  if (value.includes("tarawih")) return "tarawih";
  if (value.includes("hajat")) return "hajat";
  if (value.includes("istikharah")) return "istikharah";
  if (value.includes("taubat")) return "taubat";
  return null;
}

export function detectHabitCategory(title: string): HabitCategory {
  const value = normalizeTitle(title);
  if (getPrayerKeyFromHabitTitle(title) || ["sholat", "salat", "shalat", "prayer"].some(term => value.includes(term))) return "prayer";
  if (["quran", "tilawah", "tahsin", "tadarus"].some(term => value.includes(term))) return "quran";
  if (["hadist", "hadith", "hadis", "baca hadis"].some(term => value.includes(term))) return "hadith";
  return "general";
}
