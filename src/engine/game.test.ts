import { describe, expect, it } from "vitest";
import type { Board } from "./types";
import { countAt, neighbors } from "./board";
import { forgiveHit, newGame, reveal, toggleFlag } from "./game";
import { mulberry32 } from "./rng";

// . . . G x
// . . . . G
// . . . . .
// G . . . .
// x queda encerrada y no se abre en cascada.
const board: Board = { width: 5, height: 4, cats: [3, 9, 15], start: 6 };

describe("tablero", () => {
  it("neighbors no cruza los bordes", () => {
    expect(neighbors(board, 0).sort((a, b) => a - b)).toEqual([1, 5, 6]);
    expect(neighbors(board, 4).sort((a, b) => a - b)).toEqual([3, 8, 9]);
  });
  it("countAt cuenta gatos vecinos", () => {
    expect(countAt(board, 2)).toBe(1);
    expect(countAt(board, 6)).toBe(0);
  });
  it("mulberry32 repite la secuencia con la misma semilla", () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a()]).toEqual([b(), b()]);
  });
});

describe("partida", () => {
  it("newGame revela start y abre en cascada las casillas sin vecinos", () => {
    const s = newGame(board);
    expect(s.revealed[6]).toBe(true);
    expect(s.revealed[12]).toBe(true);
    expect(s.revealed[7]).toBe(true);
    expect(s.revealed[4]).toBe(false);
    expect(s.status).toBe("playing");
  });

  it("revelar un gato sin escudos pierde", () => {
    const s = reveal(newGame(board), 3);
    expect(s.status).toBe("lost");
    expect(s.hitCell).toBe(3);
  });

  it("revelar un gato con escudo sigue, marca y suma el perdón", () => {
    const s = reveal(newGame(board, 1), 3);
    expect(s.status).toBe("playing");
    expect(s.flagged[3]).toBe(true);
    expect(s.shields).toBe(0);
    expect(s.errorsForgiven).toBe(1);
  });

  it("forgiveHit vuelve a playing y marca la casilla", () => {
    const s = forgiveHit(reveal(newGame(board), 3));
    expect(s.status).toBe("playing");
    expect(s.flagged[3]).toBe(true);
    expect(s.hitCell).toBeNull();
    expect(s.errorsForgiven).toBe(1);
  });

  it("revelar una casilla marcada no hace nada", () => {
    const small: Board = { width: 3, height: 2, cats: [2], start: 3 };
    const s = toggleFlag(newGame(small), 2);
    expect(reveal(s, 2)).toEqual(s);
  });

  it("se gana al revelar todas las seguras aunque haya gatos sin marcar", () => {
    // start 0 tiene un vecino sin gatos y no abre todo: 0 1 G / 3 4 5
    const small: Board = { width: 3, height: 2, cats: [2], start: 0 };
    let s = newGame(small);
    for (const i of [1, 3, 4, 5]) s = reveal(s, i);
    expect(s.status).toBe("won");
    expect(s.flagged[2]).toBe(false);
  });

  it("la cascada quita la marca equivocada de una casilla segura y permite ganar", () => {
    const row: Board = { width: 5, height: 1, cats: [4], start: 3 };
    let s = newGame(row);
    s = { ...s, revealed: [false, false, false, true, false], flagged: [false, true, false, false, false] };
    s = reveal(s, 0);
    expect(s.flagged[1]).toBe(false);
    expect(s.revealed[1]).toBe(true);
    expect(s.status).toBe("won");
  });

  it("reveal y toggleFlag no hacen nada si la partida terminó", () => {
    const lost = reveal(newGame(board), 3);
    expect(reveal(lost, 0)).toBe(lost);
    expect(toggleFlag(lost, 0)).toBe(lost);
  });

  it("no muta el estado recibido", () => {
    const s = newGame(board);
    const copy = structuredClone(s);
    reveal(s, 3);
    toggleFlag(s, 0);
    expect(s).toEqual(copy);
  });
});
