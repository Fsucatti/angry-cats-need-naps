import { writeFileSync } from "node:fs";
import { DIFFICULTIES, type Difficulty } from "../src/economy/balance";
import { generateBoard } from "../src/engine/generator";
import { mulberry32 } from "../src/engine/rng";
import type { Board } from "../src/engine/types";

const DAILY_COUNT = 366;
const RESERVE_PER_LEVEL = 20;
const FIRST_DATE = "2026-11-09";

function generateMany(difficulty: Difficulty, count: number, seed: number): Board[] {
  const rng = mulberry32(seed);
  const boards: Board[] = [];
  while (boards.length < count) {
    const board = generateBoard(DIFFICULTIES[difficulty], rng, 5000);
    if (!board) throw new Error(`No se pudo generar un tablero ${difficulty}`);
    boards.push(board);
  }
  return boards;
}

const { width, height } = DIFFICULTIES.media;
const daily = generateMany("media", DAILY_COUNT, 20261201).map(({ start, cats }) => ({ start, cats }));
writeFileSync("src/data/daily-boards.json", JSON.stringify({ firstDate: FIRST_DATE, width, height, boards: daily }));

const reserve = {
  facil: generateMany("facil", RESERVE_PER_LEVEL, 101),
  media: generateMany("media", RESERVE_PER_LEVEL, 102),
  dificil: generateMany("dificil", RESERVE_PER_LEVEL, 103),
};
writeFileSync("src/data/reserve-boards.json", JSON.stringify(reserve));

console.log(`Generados ${daily.length} tableros diarios y ${RESERVE_PER_LEVEL * 3} de reserva`);
