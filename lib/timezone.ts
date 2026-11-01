// Fusos horários: cada escritório tem o seu (os lembretes automáticos contam os dias e as horas nele).
// Lista curta e útil (mercados principais primeiro); qualquer outro fuso IANA válido também é aceite.
export const TIMEZONES = [
  "Europe/Lisbon",
  "Atlantic/Azores",
  "Atlantic/Madeira",
  "Europe/Madrid",
  "Atlantic/Canary",
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Cuiaba",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
  "Africa/Luanda",
  "Africa/Maputo",
  "Atlantic/Cape_Verde",
  "Europe/London",
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/Berlin",
  "Europe/Zurich",
  "Europe/Rome",
  "Europe/Amsterdam",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Macau",
] as const;

export const DEFAULT_TZ: Record<string, string> = { PT: "Europe/Lisbon", ES: "Europe/Madrid", BR: "America/Sao_Paulo" };

export function isTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Diferença para UTC (minutos) desse fuso num instante
export function offsetMinutes(tz: string, at = Date.now()): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60000);
}

export function tzLabel(tz: string, at = Date.now()): string {
  const m = offsetMinutes(tz, at);
  const sign = m >= 0 ? "+" : "−";
  const h = Math.floor(Math.abs(m) / 60);
  const min = Math.abs(m) % 60;
  const city = tz.split("/").pop()!.replace(/_/g, " ");
  return `${city} (UTC${sign}${h}${min ? `:${String(min).padStart(2, "0")}` : ""})`;
}

// Instante (UTC) da meia-noite de um dia «AAAA-MM-DD» nesse fuso
export function localMidnight(date: string, tz: string): number {
  const guess = Date.parse(`${date}T00:00:00Z`);
  const off = offsetMinutes(tz, guess);
  const t = guess - off * 60000;
  // Correção se a mudança de hora calhar entre os dois instantes
  return guess - offsetMinutes(tz, t) * 60000;
}

export function localHour(tz: string, at = Date.now()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date(at)));
}
