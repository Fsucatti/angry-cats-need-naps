import { DAILY_REWARD, STREAK_RECOVERY_DAYS } from "../economy/balance";
import type { DailyState, Player } from "../economy/player";
import { addDays, daysBetween } from "./dates";

export function currentStreak(daily: DailyState, today: string): number {
  const { lastWonDate, streak } = daily;
  if (!lastWonDate) return 0;
  // Una victoria en una fecha "futura" sigue viva: puede ser un viaje al oeste.
  return daysBetween(lastWonDate, today) <= 1 ? streak : 0;
}

/** Si pasó más de un día sin ganar, la racha queda cortada y se puede recuperar. */
export function noteMissedDays(p: Player, today: string): Player {
  const { daily } = p;
  // Un intento en curso pertenece a su fecha, aunque ya sea el día siguiente.
  const reference = daily.inProgress?.date ?? today;
  if (daily.streak === 0 || currentStreak(daily, reference) > 0) return p;
  return { ...p, daily: { ...daily, brokenStreak: daily.streak, streak: 0 } };
}

export function recordDaily(p: Player, date: string, won: boolean, timeMs: number): Player {
  const { daily } = p;
  if (daily.results[date]) return p;
  const results = { ...daily.results, [date]: { won, timeMs } };
  if (won) {
    const gap = daily.lastWonDate ? daysBetween(daily.lastWonDate, date) : Infinity;
    const streak = gap <= 0 ? Math.max(daily.streak, 1) : gap === 1 ? daily.streak + 1 : 1;
    return {
      ...p,
      latas: p.latas + DAILY_REWARD,
      daily: {
        ...daily,
        results,
        inProgress: null,
        streak,
        lastWonDate: gap <= 0 ? daily.lastWonDate : date,
        brokenStreak: 0,
      },
    };
  }
  const lost = currentStreak(daily, date) || daily.brokenStreak;
  return { ...p, daily: { ...daily, results, inProgress: null, streak: 0, brokenStreak: lost } };
}

export function canRecoverStreak(daily: DailyState, today: string): boolean {
  if (daily.brokenStreak <= 0) return false;
  return !daily.lastRecoveryDate || daysBetween(daily.lastRecoveryDate, today) >= STREAK_RECOVERY_DAYS;
}

export function recoverStreak(p: Player, today: string): Player {
  const { daily } = p;
  if (!canRecoverStreak(daily, today)) return p;
  const playedToday = daily.results[today] !== undefined;
  return {
    ...p,
    daily: {
      ...daily,
      streak: daily.brokenStreak,
      brokenStreak: 0,
      lastWonDate: playedToday ? today : addDays(today, -1),
      lastRecoveryDate: today,
    },
  };
}
