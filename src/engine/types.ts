/** Las casillas se identifican por índice: y * width + x. */
export interface Board {
  width: number;
  height: number;
  cats: number[];
  start: number;
}

export interface GameState {
  board: Board;
  revealed: boolean[];
  flagged: boolean[];
  status: "playing" | "won" | "lost";
  hitCell: number | null;
  shields: number;
  errorsForgiven: number;
}
