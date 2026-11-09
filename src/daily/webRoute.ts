import { dailyBoard } from "./boards";
import { keyToDays } from "./dates";

/** Decide qué fecha abre la web. Null significa que todavía no hay desafíos. */
export function resolveWebDate(requested: string | null, today: string): string | null {
  const days = requested ? keyToDays(requested) : null;
  const todayDays = keyToDays(today)!;
  if (requested && days !== null && days <= todayDays && dailyBoard(requested)) return requested;
  return dailyBoard(today) ? today : null;
}
