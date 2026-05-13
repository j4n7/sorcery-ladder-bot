const MADRID_TIMEZONE = "Europe/Madrid";

function getMadridParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  };

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    weekday: weekdayMap[lookup.weekday] ?? 1
  };
}

function madridDateToUtc(year: number, month: number, day: number): Date {
  // This is good enough for weekly league boundaries. The offset is resolved by checking Madrid local parts.
  const approximate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(approximate).map((part) => [part.type, part.value]));
  const localHour = Number(parts.hour);
  const localMinute = Number(parts.minute);
  const localSecond = Number(parts.second);
  const offsetMs = ((localHour * 60 + localMinute) * 60 + localSecond) * 1000;
  return new Date(approximate.getTime() - offsetMs);
}

export function getMadridWeekRange(date: Date): { start: Date; end: Date } {
  const parts = getMadridParts(date);
  const startDay = parts.day - (parts.weekday - 1);
  const start = madridDateToUtc(parts.year, parts.month, startDay);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}
