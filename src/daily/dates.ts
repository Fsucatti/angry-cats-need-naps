const DAY_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Convierte una clave a días de calendario, sin pasar por la zona horaria. Null si no es válida. */
export function keyToDays(key: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const parsed = new Date(ms);
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return ms / DAY_MS;
}

export function addDays(key: string, n: number): string {
  const days = keyToDays(key);
  if (days === null) throw new Error(`Fecha inválida: ${key}`);
  const d = new Date((days + n) * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function daysBetween(from: string, to: string): number {
  return (keyToDays(to) ?? 0) - (keyToDays(from) ?? 0);
}
