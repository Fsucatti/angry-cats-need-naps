import type { Board } from "./types";

export function neighbors(board: Board, i: number): number[] {
  const { width, height } = board;
  const x = i % width;
  const y = Math.floor(i / width);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) result.push(ny * width + nx);
    }
  }
  return result;
}

export function countAt(board: Board, i: number): number {
  return neighbors(board, i).filter((n) => board.cats.includes(n)).length;
}
