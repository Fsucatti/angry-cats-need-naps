import { openSafe } from "./game";
import type { GameState } from "./types";

export type PowerId = "olfato" | "sieteVidas" | "oidoFino" | "vigia" | "barrido";

export interface Power {
  id: PowerId;
  level: 1 | 2;
}

export interface PowerResult {
  state: GameState;
  rowCount?: number;
  columnCount?: number;
}

export function shieldsFor(power: Power | null): number {
  return power?.id === "sieteVidas" ? power.level : 0;
}

export function needsTarget(power: Power): boolean {
  return power.id === "oidoFino" || power.id === "barrido";
}

/** Un poder sin efecto posible no se puede gastar. */
export function canUsePower(state: GameState, power: Power): boolean {
  const { board, revealed, flagged } = state;
  if (power.id === "vigia") return board.cats.some((c) => !flagged[c]);
  if (power.id === "olfato") return revealed.some((open, i) => !open && !board.cats.includes(i));
  return true;
}

function pick<T>(items: T[], count: number, rng: () => number): T[] {
  const pool = [...items];
  const chosen: T[] = [];
  while (chosen.length < count && pool.length > 0) {
    chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return chosen;
}

function olfato(state: GameState, level: number, rng: () => number): PowerResult {
  const { board, revealed } = state;
  const hiddenSafe = revealed.flatMap((open, i) => (!open && !board.cats.includes(i) ? [i] : []));
  return { state: pick(hiddenSafe, level, rng).reduce(openSafe, state) };
}

function vigia(state: GameState, level: number, rng: () => number): PowerResult {
  const unmarked = state.board.cats.filter((c) => !state.flagged[c]);
  const flagged = [...state.flagged];
  for (const cat of pick(unmarked, level, rng)) flagged[cat] = true;
  return { state: { ...state, flagged } };
}

function oidoFino(state: GameState, level: number, target: number): PowerResult {
  const { width, cats } = state.board;
  const rowCount = cats.filter((c) => Math.floor(c / width) === Math.floor(target / width)).length;
  if (level === 1) return { state, rowCount };
  return { state, rowCount, columnCount: cats.filter((c) => c % width === target % width).length };
}

function barrido(state: GameState, level: number, target: number): PowerResult {
  const { width, height, cats } = state.board;
  const side = level + 1;
  const left = target % width;
  const top = Math.floor(target / width);
  let next = state;
  for (let y = top; y < Math.min(top + side, height); y++) {
    for (let x = left; x < Math.min(left + side, width); x++) {
      const cell = y * width + x;
      if (!cats.includes(cell)) next = openSafe(next, cell);
    }
  }
  return { state: next };
}

export function applyPower(state: GameState, power: Power, target: number | null, rng: () => number): PowerResult {
  if (state.status !== "playing") return { state };
  switch (power.id) {
    case "olfato":
      return olfato(state, power.level, rng);
    case "vigia":
      return vigia(state, power.level, rng);
    case "oidoFino":
      return target === null ? { state } : oidoFino(state, power.level, target);
    case "barrido":
      return target === null ? { state } : barrido(state, power.level, target);
    case "sieteVidas":
      return { state };
  }
}
