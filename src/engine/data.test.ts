import { describe, expect, it } from "vitest";
import daily from "../data/daily-boards.json";
import reserve from "../data/reserve-boards.json";
import { isSolvableWithoutGuessing } from "./solver";
import type { Board } from "./types";

describe("tableros incluidos en la app", () => {
  it("los diarios son 366 y se resuelven sin adivinar", () => {
    expect(daily.boards).toHaveLength(366);
    for (const { start, cats } of daily.boards) {
      expect(isSolvableWithoutGuessing({ width: daily.width, height: daily.height, start, cats })).toBe(true);
    }
  });

  it("los de reserva son 60 y se resuelven sin adivinar", () => {
    const all: Board[] = [...reserve.facil, ...reserve.media, ...reserve.dificil];
    expect(all).toHaveLength(60);
    for (const board of all) expect(isSolvableWithoutGuessing(board)).toBe(true);
  });
});
