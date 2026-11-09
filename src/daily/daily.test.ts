import { describe, expect, it } from "vitest";
import { newPlayer, type Player } from "../economy/player";
import { dailyBoard } from "./boards";
import { addDays, dateKey } from "./dates";
import { shareText } from "./share";
import { canRecoverStreak, currentStreak, noteMissedDays, recordDaily, recoverStreak } from "./streak";

describe("fechas", () => {
  it("dateKey usa la fecha local", () => {
    expect(dateKey(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
    expect(dateKey(new Date(2027, 0, 1, 0, 1))).toBe("2027-01-01");
  });

  it("addDays usa el calendario, también en cambios de horario y fin de año", () => {
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("tablero de cada fecha", () => {
  it("da el mismo tablero para la misma fecha", () => {
    expect(dailyBoard("2026-12-05")).toEqual(dailyBoard("2026-12-05"));
    expect(dailyBoard("2026-12-05")).not.toEqual(dailyBoard("2026-12-06"));
  });

  it("no tiene tablero antes del primero o con una fecha mal formada", () => {
    expect(dailyBoard("2026-11-08")).toBeNull();
    expect(dailyBoard("hola")).toBeNull();
    expect(dailyBoard("2026-13-45")).toBeNull();
  });

  it("vuelve a empezar después del último", () => {
    expect(dailyBoard(addDays("2026-11-09", 366))).toEqual(dailyBoard("2026-11-09"));
  });
});

describe("racha", () => {
  const win = (p: Player, date: string) => recordDaily(p, date, true, 1000);

  it("suma con días seguidos y da 40 latas por ganar", () => {
    let p = win(newPlayer(), "2026-12-01");
    p = win(p, "2026-12-02");
    expect(p.daily.streak).toBe(2);
    expect(p.latas).toBe(80);
    expect(currentStreak(p.daily, "2026-12-02")).toBe(2);
    expect(currentStreak(p.daily, "2026-12-03")).toBe(2);
  });

  it("un día sin jugar la lleva a cero y guarda lo perdido", () => {
    const p = win(win(newPlayer(), "2026-12-01"), "2026-12-02");
    expect(currentStreak(p.daily, "2026-12-04")).toBe(0);
    const noted = noteMissedDays(p, "2026-12-04");
    expect(noted.daily.brokenStreak).toBe(2);
    expect(noted.daily.streak).toBe(0);
    expect(win(noted, "2026-12-04").daily.streak).toBe(1);
  });

  it("perder corta la racha y no da latas", () => {
    const p = recordDaily(win(newPlayer(), "2026-12-01"), "2026-12-02", false, 500);
    expect(p.daily.streak).toBe(0);
    expect(p.daily.brokenStreak).toBe(1);
    expect(p.latas).toBe(40);
  });

  it("la misma fecha no se cuenta dos veces", () => {
    const once = win(newPlayer(), "2026-12-01");
    expect(win(once, "2026-12-01")).toBe(once);
    expect(recordDaily(once, "2026-12-01", false, 1)).toBe(once);
  });

  it("guarda el resultado en la fecha en que empezó el intento", () => {
    const p = win(newPlayer(), "2026-12-01");
    expect(p.daily.results["2026-12-01"]).toEqual({ won: true, timeMs: 1000 });
    expect(p.daily.results["2026-12-02"]).toBeUndefined();
  });

  it("limpia el intento en curso al terminar", () => {
    const base = newPlayer();
    const p: Player = { ...base, daily: { ...base.daily, inProgress: { date: "2026-12-01", state: null as never, elapsedMs: 0 } } };
    expect(win(p, "2026-12-01").daily.inProgress).toBeNull();
  });
});

describe("recuperar la racha", () => {
  const broken = () => recordDaily(recordDaily(newPlayer(), "2026-12-01", true, 1), "2026-12-02", false, 1);

  it("se permite si se perdió y la deja como ganada hoy", () => {
    const p = broken();
    expect(canRecoverStreak(p.daily, "2026-12-02")).toBe(true);
    const r = recoverStreak(p, "2026-12-02");
    expect(r.daily.streak).toBe(1);
    expect(r.daily.lastWonDate).toBe("2026-12-02");
    expect(r.daily.brokenStreak).toBe(0);
    expect(recordDaily(r, "2026-12-03", true, 1).daily.streak).toBe(2);
  });

  it("si se cortó por no jugar, deja seguir hoy", () => {
    const p = noteMissedDays(recordDaily(newPlayer(), "2026-12-01", true, 1), "2026-12-05");
    const r = recoverStreak(p, "2026-12-05");
    expect(r.daily.lastWonDate).toBe("2026-12-04");
    expect(recordDaily(r, "2026-12-05", true, 1).daily.streak).toBe(2);
  });

  it("se rechaza a los 6 días de la anterior y se permite a los 7", () => {
    const p = broken();
    const withRecovery = { ...p, daily: { ...p.daily, lastRecoveryDate: "2026-11-26" } };
    expect(canRecoverStreak(withRecovery.daily, "2026-12-02")).toBe(false);
    expect(recoverStreak(withRecovery, "2026-12-02")).toBe(withRecovery);
    expect(canRecoverStreak(withRecovery.daily, "2026-12-03")).toBe(true);
  });

  it("sin racha cortada no hay nada que recuperar", () => {
    expect(canRecoverStreak(newPlayer().daily, "2026-12-02")).toBe(false);
  });
});

describe("resumen para compartir", () => {
  const args = { date: "2026-12-05", won: true, timeMs: 125000, streak: 3, url: "https://game.example/d/2026-12-05" };

  it("incluye fecha, resultado, tiempo, racha y enlace en castellano", () => {
    const text = shareText({ ...args, lang: "es" });
    for (const part of ["Angry Cats Need Naps Too", "2026-12-05", "Gané", "2:05", "3", args.url]) expect(text).toContain(part);
  });

  it("también en inglés, y cuando se pierde", () => {
    expect(shareText({ ...args, lang: "en" })).toContain("Won");
    expect(shareText({ ...args, won: false, lang: "es" })).toContain("Perdí");
    expect(shareText({ ...args, won: false, lang: "en" })).toContain("Lost");
  });
});
