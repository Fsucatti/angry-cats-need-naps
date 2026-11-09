import { newPlayer, type Player } from "../economy/player";
import type { KeyValue } from "./keyvalue";

export const MAIN_KEY = "refugio.progress";
export const BACKUP_KEY = "refugio.progress.backup";

export type LoadStatus = "ok" | "restored" | "reset";

function isRecord(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

function parse(raw: string | null): Player | null {
  if (raw === null) return null;
  try {
    const p = JSON.parse(raw) as Player | null;
    const valid =
      p !== null &&
      typeof p === "object" &&
      p.version === 1 &&
      Number.isFinite(p.latas) &&
      Number.isInteger(p.rescued) &&
      isRecord(p.rooms) &&
      isRecord(p.wins) &&
      isRecord(p.daily) &&
      isRecord(p.daily.results);
    return valid ? p : null;
  } catch {
    return null;
  }
}

/** Escribe primero el respaldo: si se corta en el medio, el principal anterior sigue sano. */
export async function saveProgress(kv: KeyValue, p: Player): Promise<void> {
  const raw = JSON.stringify(p);
  await kv.set(BACKUP_KEY, raw);
  await kv.set(MAIN_KEY, raw);
}

export async function loadProgress(kv: KeyValue): Promise<{ player: Player; status: LoadStatus }> {
  try {
    const mainRaw = await kv.get(MAIN_KEY);
    const main = parse(mainRaw);
    if (main) return { player: main, status: "ok" };
    const backupRaw = await kv.get(BACKUP_KEY);
    const backup = parse(backupRaw);
    if (backup) return { player: backup, status: "restored" };
    const neverSaved = mainRaw === null && backupRaw === null;
    return { player: newPlayer(), status: neverSaved ? "ok" : "reset" };
  } catch {
    return { player: newPlayer(), status: "reset" };
  }
}
