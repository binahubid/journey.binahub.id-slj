// Pure helpers shared by the browser and the Supabase reminder worker.
export function getPrayerLocation(value: string) {
  const city = value.trim() || "Jakarta";
  const key = city.toLowerCase().replace(/[^a-z]/g, "");
  const saudi: Record<string, string> = {
    makkah: "Makkah",
    mecca: "Makkah",
    mekah: "Makkah",
    makkahalmukarramah: "Makkah",
    madinah: "Madinah",
    medina: "Madinah",
    madina: "Madinah",
    madinahmunawwarah: "Madinah",
    jeddah: "Jeddah",
    jedah: "Jeddah",
    riyadh: "Riyadh",
  };
  if (saudi[key])
    return {
      city: saudi[key],
      country: "Saudi Arabia",
      method: 4,
      timeZone: "Asia/Riyadh",
    };
  const indonesiaZones: Record<string, string> = {
    jakarta: "Asia/Jakarta",
    bandung: "Asia/Jakarta",
    surabaya: "Asia/Jakarta",
    yogyakarta: "Asia/Jakarta",
    makassar: "Asia/Makassar",
    denpasar: "Asia/Makassar",
    mataram: "Asia/Makassar",
    balikpapan: "Asia/Makassar",
    jayapura: "Asia/Jayapura",
    ambon: "Asia/Jayapura",
  };
  return {
    city,
    country: "Indonesia",
    method: 20,
    timeZone: indonesiaZones[key],
  };
}

export function prayerTimesUrl(
  city: string,
  localDate: string,
  timeZone?: string,
) {
  const location = getPrayerLocation(city);
  const [year, month, day] = localDate.split("-");
  const params = new URLSearchParams({
    city: location.city,
    country: location.country,
    method: String(location.method),
  });
  if (timeZone || location.timeZone)
    params.set("timezonestring", timeZone || location.timeZone!);
  return `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?${params}`;
}

export function zonedMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return (
    Number(parts.find((part) => part.type === "hour")?.value) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value)
  );
}
