/**
 * Horarios del torneo en hora de Colombia.
 * shortcut: zona fija (UTC-5, sin horario de verano), para que la hora se vea
 * igual en el panel, en la web pública y en cualquier servidor. Si el producto
 * sale de Colombia, esto pasa a ser un campo del torneo.
 */
export const TOURNAMENT_TZ = "America/Bogota";
const TZ_OFFSET = "-05:00";

/** "2026-11-20T18:00" (lo que da un input datetime-local) → Date. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}:00${TZ_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "2026-11-20T18:00", para rellenar un input datetime-local. */
export function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOURNAMENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "sáb 20 nov · 18:00" */
export function formatMatchDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TOURNAMENT_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
