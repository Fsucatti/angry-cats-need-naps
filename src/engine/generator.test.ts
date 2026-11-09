import { describe, expect, it } from "vitest";
import { DIFFICULTIES, type Difficulty } from "../economy/balance";
import { neighbors } from "./board";
import { boardWithBudget, generateBoard } from "./generator";
import { mulberry32 } from "./rng";
import { isSolvableWithoutGuessing } from "./solver";
import { TUTORIAL_BOARD } from "./tutorial";
import type { Board } from "./types";

describe("isSolvableWithoutGuessing", () => {
  it("rechaza un tablero que termina en un 50/50", () => {
    const board: Board = { width: 4, height: 2, cats: [3], start: 0 };
    expect(isSolvableWithoutGuessing(board)).toBe(false);
  });

  it("acepta un tablero trivial", () => {
    const board: Board = { width: 3, height: 3, cats: [8], start: 0 };
    expect(isSolvableWithoutGuessing(board)).toBe(true);
  });
});

describe("generateBoard", () => {
  const levels = Object.keys(DIFFICULTIES) as Difficulty[];

  for (const level of levels) {
    for (const seed of [1, 2, 3]) {
      it(`${level} con semilla ${seed} cumple las reglas`, () => {
        const spec = DIFFICULTIES[level];
        const board = generateBoard(spec, mulberry32(seed), 5000);
        expect(board).not.toBeNull();
        expect(new Set(board!.cats).size).toBe(spec.cats);
        expect(board!.cats).not.toContain(board!.start);
        for (const n of neighbors(board!, board!.start)) expect(board!.cats).not.toContain(n);
        expect(isSolvableWithoutGuessing(board!)).toBe(true);
      });
    }
  }

  it("misma semilla, mismo tablero", () => {
    const spec = DIFFICULTIES.facil;
    expect(generateBoard(spec, mulberry32(9), 500)).toEqual(generateBoard(spec, mulberry32(9), 500));
  });
});

describe("boardWithBudget", () => {
  it("usa un tablero de reserva si se agota el tiempo", () => {
    const reserve: Board[] = [{ width: 8, height: 8, cats: [63], start: 0 }];
    let time = 0;
    const board = boardWithBudget("facil", mulberry32(1), 100, reserve, () => (time += 1000));
    expect(board).toBe(reserve[0]);
  });

  it("devuelve un tablero generado si hay tiempo", () => {
    const board = boardWithBudget("facil", mulberry32(1), 5000, []);
    expect(board.cats).toHaveLength(DIFFICULTIES.facil.cats);
  });
});

describe("tutorial", () => {
  it("es de 5 x 5 y se resuelve sin adivinar", () => {
    expect(TUTORIAL_BOARD.width).toBe(5);
    expect(TUTORIAL_BOARD.height).toBe(5);
    expect(isSolvableWithoutGuessing(TUTORIAL_BOARD)).toBe(true);
  });
});
