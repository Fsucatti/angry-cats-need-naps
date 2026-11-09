import data from "../data/daily-boards.json";
import type { Board } from "../engine/types";
import { keyToDays } from "./dates";

export const FIRST_DAILY_DATE = data.firstDate;

export function dailyBoard(key: string): Board | null {
  const day = keyToDays(key);
  const first = keyToDays(data.firstDate)!;
  if (day === null || day < first) return null;
  const { start, cats } = data.boards[(day - first) % data.boards.length];
  return { width: data.width, height: data.height, start, cats };
}
