import { DIFFICULTIES, type Difficulty } from "../economy/balance";
import { neighbors } from "./board";
import { isSolvableWithoutGuessing } from "./solver";
import type { Board } from "./types";

type Spec = { width: number; height: number; cats: number };

function candidate(spec: Spec, rng: () => number): Board {
  const { width, height, cats } = spec;
  // La primera casilla sale de la zona central para que la apertura sea generosa.
  const x = Math.floor(width / 4 + (rng() * width) / 2);
  const y = Math.floor(height / 4 + (rng() * height) / 2);
  const start = y * width + x;
  const shell: Board = { width, height, cats: [], start };
  const excluded = new Set([start, ...neighbors(shell, start)]);
  const pool: number[] = [];
  for (let i = 0; i < width * height; i++) if (!excluded.has(i)) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { ...shell, cats: pool.slice(0, cats).sort((a, b) => a - b) };
}

export function generateBoard(spec: Spec, rng: () => number, maxAttempts: number): Board | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = candidate(spec, rng);
    if (isSolvableWithoutGuessing(board)) return board;
  }
  return null;
}

export function boardWithBudget(
  difficulty: Difficulty,
  rng: () => number,
  budgetMs: number,
  reserve: Board[],
  now: () => number = () => performance.now(),
): Board {
  const spec = DIFFICULTIES[difficulty];
  const startedAt = now();
  while (now() - startedAt < budgetMs) {
    const board = generateBoard(spec, rng, 1);
    if (board) return board;
  }
  return reserve[Math.floor(rng() * reserve.length)];
}
