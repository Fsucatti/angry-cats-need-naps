import { describe, expect, it } from "vitest";
import { newPlayer, type Player } from "../economy/player";
import { canRecoverStreak, currentStreak, noteMissedDays, recordDaily } from "./streak";

function withStreak(streak: number, lastWonDate: string, inProgressDate?: string): Player {
  const base = newPlayer();
  return {
    ...base,
    daily: {
      ...base.daily,
      streak,
      lastWonDate,
      inProgress: inProgressDate ? { date: inProgressDate, state: null as never, elapsedMs: 0 } : null,
    },
  };
}

describe("racha en casos de borde", () => {
  it("retomar después de medianoche un intento de ayer no corta la racha", () => {
    const p = withStreak(5, "2026-12-04", "2026-12-05");
    const noted = noteMissedDays(p, "2026-12-06");
    expect(noted.daily.streak).toBe(5);
    expect(recordDaily(noted, "2026-12-05", true, 1000).daily.streak).toBe(6);
  });

  it("viajar al oeste no corta la racha ganada en una fecha que ahora es futura", () => {
    const p = withStreak(3, "2026-12-03");
    expect(currentStreak(p.daily, "2026-12-02")).toBe(3);
    expect(noteMissedDays(p, "2026-12-02").daily.streak).toBe(3);
  });

  it("ganar una fecha anterior a la última victoria conserva la racha", () => {
    const won = recordDaily(withStreak(3, "2026-12-03"), "2026-12-02", true, 1000);
    expect(won.daily.streak).toBe(3);
    expect(won.daily.lastWonDate).toBe("2026-12-03");
    expect(recordDaily(won, "2026-12-04", true, 1000).daily.streak).toBe(4);
  });

  it("sigue cortando la racha si de verdad pasó más de un día", () => {
    const noted = noteMissedDays(withStreak(5, "2026-12-01"), "2026-12-05");
    expect(noted.daily.streak).toBe(0);
    expect(canRecoverStreak(noted.daily, "2026-12-05")).toBe(true);
  });
});
