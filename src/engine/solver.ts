import { countAt, neighbors } from "./board";
import type { Board } from "./types";

interface Constraint {
  cells: number[];
  cats: number;
}

/** Resuelve solo con deducciones: nunca enumera combinaciones ni adivina. */
export function isSolvableWithoutGuessing(board: Board): boolean {
  const size = board.width * board.height;
  const opened = new Array<boolean>(size).fill(false);
  const marked = new Array<boolean>(size).fill(false);
  const pending = [board.start];

  const open = (cell: number) => {
    if (opened[cell]) return;
    if (board.cats.includes(cell)) throw new Error("El solucionador intentó abrir un gato");
    opened[cell] = true;
    pending.push(cell);
  };

  // Abre lo pendiente y calcula cuántas casillas quedan por deducir.
  const safeTotal = size - board.cats.length;
  while (true) {
    while (pending.length > 0) {
      const cell = pending.pop()!;
      if (!opened[cell]) open(cell);
      if (countAt(board, cell) === 0) neighbors(board, cell).forEach(open);
    }
    if (opened.filter(Boolean).length === safeTotal) return true;

    const constraints: Constraint[] = [];
    for (let i = 0; i < size; i++) {
      if (!opened[i]) continue;
      const around = neighbors(board, i);
      const hidden = around.filter((n) => !opened[n] && !marked[n]);
      if (hidden.length === 0) continue;
      constraints.push({ cells: hidden, cats: countAt(board, i) - around.filter((n) => marked[n]).length });
    }

    let progress = false;
    const applySafe = (cells: number[]) => {
      for (const c of cells) {
        if (!opened[c]) {
          open(c);
          progress = true;
        }
      }
    };
    const applyCats = (cells: number[]) => {
      for (const c of cells) {
        if (!marked[c]) {
          marked[c] = true;
          progress = true;
        }
      }
    };

    for (const { cells, cats } of constraints) {
      if (cats === 0) applySafe(cells);
      else if (cats === cells.length) applyCats(cells);
    }

    if (!progress) {
      for (const a of constraints) {
        const inA = new Set(a.cells);
        for (const b of constraints) {
          if (a === b || a.cells.length >= b.cells.length) continue;
          if (!a.cells.every((c) => b.cells.includes(c))) continue;
          const rest = b.cells.filter((c) => !inA.has(c));
          const cats = b.cats - a.cats;
          if (cats === 0) applySafe(rest);
          else if (cats === rest.length) applyCats(rest);
        }
      }
    }

    if (!progress) {
      const unknown: number[] = [];
      for (let i = 0; i < size; i++) if (!opened[i] && !marked[i]) unknown.push(i);
      const remaining = board.cats.length - marked.filter(Boolean).length;
      if (remaining === 0) applySafe(unknown);
      else if (remaining === unknown.length) applyCats(unknown);
    }

    if (!progress) return false;
  }
}
