import { describe, expect, it } from "vitest";
import { newGame, reveal, toggleFlag } from "./game";
import { applyPower, canUsePower, needsTarget, shieldsFor } from "./powers";
import { mulberry32 } from "./rng";
import type { Board, GameState } from "./types";

// Fila 0: . . . G x / fila 1: . . . . G / fila 2: . . . . . / fila 3: G . x . .
const board: Board = { width: 5, height: 4, cats: [3, 9, 15], start: 6 };
const rng = () => mulberry32(3);

function hiddenBoard(): GameState {
  const size = board.width * board.height;
  return {
    ...newGame(board),
    revealed: new Array<boolean>(size).fill(false),
    flagged: new Array<boolean>(size).fill(false),
  };
}

const revealedCount = (s: GameState) => s.revealed.filter(Boolean).length;

describe("poderes", () => {
  it("shieldsFor solo da escudos con Siete vidas", () => {
    expect(shieldsFor({ id: "sieteVidas", level: 2 })).toBe(2);
    expect(shieldsFor({ id: "olfato", level: 1 })).toBe(0);
    expect(shieldsFor(null)).toBe(0);
  });

  it("needsTarget solo en Oído fino y Barrido", () => {
    expect(needsTarget({ id: "oidoFino", level: 1 })).toBe(true);
    expect(needsTarget({ id: "barrido", level: 2 })).toBe(true);
    expect(needsTarget({ id: "vigia", level: 1 })).toBe(false);
  });

  it("Olfato nivel 1 abre una casilla segura y nunca un gato", () => {
    // La casilla 4 es la única oculta y segura cerca de los gatos.
    const { state } = applyPower(newGame(board), { id: "olfato", level: 1 }, null, rng());
    expect(state.status).not.toBe("lost");
    expect(board.cats.some((c) => state.revealed[c])).toBe(false);
    expect(revealedCount(state)).toBeGreaterThan(revealedCount(newGame(board)));
  });

  it("Olfato nivel 2 elige dos casillas seguras", () => {
    const sparse: Board = { width: 5, height: 1, cats: [1, 3], start: 4 };
    const start = { ...newGame(sparse), revealed: [false, false, false, false, false] };
    const { state } = applyPower(start, { id: "olfato", level: 2 }, null, rng());
    expect(state.revealed.filter(Boolean)).toHaveLength(2);
    expect(state.revealed[1] || state.revealed[3]).toBe(false);
  });

  it("Vigía marca gatos según el nivel", () => {
    const one = applyPower(newGame(board), { id: "vigia", level: 1 }, null, rng()).state;
    expect(board.cats.filter((c) => one.flagged[c])).toHaveLength(1);
    const two = applyPower(newGame(board), { id: "vigia", level: 2 }, null, rng()).state;
    expect(board.cats.filter((c) => two.flagged[c])).toHaveLength(2);
  });

  it("Vigía marca los que queden si hay menos que su nivel", () => {
    let s = newGame(board);
    s = toggleFlag(toggleFlag(s, 3), 9);
    const { state } = applyPower(s, { id: "vigia", level: 2 }, null, rng());
    expect(board.cats.filter((c) => state.flagged[c])).toHaveLength(3);
  });

  it("Oído fino informa la fila, y en nivel 2 también la columna, sin cambiar el tablero", () => {
    const s = newGame(board);
    const one = applyPower(s, { id: "oidoFino", level: 1 }, 8, rng());
    expect(one.rowCount).toBe(1);
    expect(one.columnCount).toBeUndefined();
    expect(one.state).toEqual(s);
    const two = applyPower(s, { id: "oidoFino", level: 2 }, 8, rng());
    expect(two.rowCount).toBe(1);
    expect(two.columnCount).toBe(1);
  });

  it("Barrido nivel 1 abre solo las seguras del área de 2 x 2", () => {
    const { state } = applyPower(hiddenBoard(), { id: "barrido", level: 1 }, 3, rng());
    expect(state.revealed[4]).toBe(true);
    expect(state.revealed[8]).toBe(true);
    expect(state.revealed[3]).toBe(false);
    expect(state.revealed[9]).toBe(false);
  });

  it("Barrido nivel 2 cubre 3 x 3 y se recorta en el borde", () => {
    const { state } = applyPower(hiddenBoard(), { id: "barrido", level: 2 }, 13, rng());
    expect(state.revealed[13]).toBe(true);
    expect(state.revealed[14]).toBe(true);
    expect(state.revealed[19]).toBe(true);
    expect(state.status).not.toBe("lost");
  });

  it("Barrido quita una marca equivocada de una casilla segura", () => {
    const flagged = toggleFlag(hiddenBoard(), 4);
    const { state } = applyPower(flagged, { id: "barrido", level: 1 }, 3, rng());
    expect(state.flagged[4]).toBe(false);
    expect(state.revealed[4]).toBe(true);
  });

  it("puede dar la victoria al revelar la última segura", () => {
    let s = newGame(board);
    for (let i = 0; i < 20; i++) if (i !== 4 && !board.cats.includes(i)) s = reveal(s, i);
    expect(s.status).toBe("playing");
    const { state } = applyPower(s, { id: "olfato", level: 1 }, null, rng());
    expect(state.status).toBe("won");
  });

  it("canUsePower es falso para Vigía sin gatos por marcar", () => {
    let s = newGame(board);
    for (const cat of board.cats) s = toggleFlag(s, cat);
    expect(canUsePower(s, { id: "vigia", level: 1 })).toBe(false);
    expect(canUsePower(newGame(board), { id: "vigia", level: 1 })).toBe(true);
  });

  it("canUsePower es falso para Olfato sin casillas seguras ocultas", () => {
    const s = { ...newGame(board), revealed: newGame(board).revealed.map((_, i) => !board.cats.includes(i)) };
    expect(canUsePower(s, { id: "olfato", level: 1 })).toBe(false);
    expect(canUsePower(newGame(board), { id: "olfato", level: 1 })).toBe(true);
  });

  it("no hace nada si la partida terminó", () => {
    const lost = reveal(newGame(board), 3);
    expect(applyPower(lost, { id: "olfato", level: 1 }, null, rng()).state).toBe(lost);
  });
});
