import { countAt, neighbors } from "./board";
import type { Board, GameState } from "./types";

function withWinCheck(state: GameState): GameState {
  const { board, revealed } = state;
  const safeCells = board.width * board.height - board.cats.length;
  const opened = revealed.filter(Boolean).length;
  return opened >= safeCells && state.status === "playing" ? { ...state, status: "won" } : state;
}

/** Abre una casilla segura y su cascada, y quita las marcas equivocadas que encuentre. */
export function openSafe(state: GameState, cell: number): GameState {
  const revealed = [...state.revealed];
  const flagged = [...state.flagged];
  const pending = [cell];
  while (pending.length > 0) {
    const i = pending.pop()!;
    if (revealed[i]) continue;
    revealed[i] = true;
    flagged[i] = false;
    if (countAt(state.board, i) === 0) pending.push(...neighbors(state.board, i));
  }
  return withWinCheck({ ...state, revealed, flagged });
}

export function newGame(board: Board, shields = 0): GameState {
  const size = board.width * board.height;
  return openSafe(
    {
      board,
      revealed: new Array<boolean>(size).fill(false),
      flagged: new Array<boolean>(size).fill(false),
      status: "playing",
      hitCell: null,
      shields,
      errorsForgiven: 0,
    },
    board.start,
  );
}

export function reveal(state: GameState, i: number): GameState {
  if (state.status !== "playing" || state.flagged[i] || state.revealed[i]) return state;
  if (!state.board.cats.includes(i)) return openSafe(state, i);
  if (state.shields > 0) {
    const flagged = [...state.flagged];
    flagged[i] = true;
    return { ...state, flagged, shields: state.shields - 1, errorsForgiven: state.errorsForgiven + 1 };
  }
  return { ...state, status: "lost", hitCell: i };
}

export function toggleFlag(state: GameState, i: number): GameState {
  if (state.status !== "playing" || state.revealed[i]) return state;
  const flagged = [...state.flagged];
  flagged[i] = !flagged[i];
  return { ...state, flagged };
}

export function forgiveHit(state: GameState): GameState {
  if (state.status !== "lost" || state.hitCell === null) return state;
  const flagged = [...state.flagged];
  flagged[state.hitCell] = true;
  return { ...state, status: "playing", flagged, hitCell: null, errorsForgiven: state.errorsForgiven + 1 };
}
