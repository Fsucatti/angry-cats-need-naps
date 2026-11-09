import type { GameState } from "../engine/types";
import {
  CAT_PRICES,
  LOSS_REWARD,
  PERFECT_MULTIPLIER,
  ROOM_PRICES,
  TUTORIAL_REWARD,
  WIN_REWARD,
  WINS_TO_UNLOCK_DIFICIL,
  WINS_TO_UNLOCK_MEDIA,
  type Difficulty,
} from "./balance";
import { CATS } from "./cats";

export type Room = "entrada" | "patio" | "dormitorio";

export interface DailyState {
  results: Record<string, { won: boolean; timeMs: number }>;
  inProgress: { date: string; state: GameState; elapsedMs: number } | null;
  lastFinal?: { date: string; state: GameState };
  streak: number;
  lastWonDate: string | null;
  brokenStreak: number;
  lastRecoveryDate: string | null;
}

export interface Player {
  version: 1;
  latas: number;
  rescued: number;
  rooms: Record<Room, number>;
  wins: Record<Difficulty, number>;
  tutorialDone: boolean;
  companion: string | null;
  language: "es" | "en" | null;
  daily: DailyState;
}

export function newPlayer(): Player {
  return {
    version: 1,
    latas: 0,
    rescued: 0,
    rooms: { entrada: 0, patio: 0, dormitorio: 0 },
    wins: { facil: 0, media: 0, dificil: 0 },
    tutorialDone: false,
    companion: null,
    language: null,
    daily: { results: {}, inProgress: null, streak: 0, lastWonDate: null, brokenStreak: 0, lastRecoveryDate: null },
  };
}

export function gameReward(d: Difficulty, won: boolean, errorsForgiven: number): number {
  if (!won) return LOSS_REWARD;
  return errorsForgiven === 0 ? Math.round(WIN_REWARD[d] * PERFECT_MULTIPLIER) : WIN_REWARD[d];
}

export function isUnlocked(p: Player, d: Difficulty): boolean {
  if (d === "facil") return p.tutorialDone;
  if (d === "media") return p.wins.facil >= WINS_TO_UNLOCK_MEDIA;
  return p.wins.media >= WINS_TO_UNLOCK_DIFICIL;
}

export function finishGame(
  p: Player,
  d: Difficulty,
  won: boolean,
  errorsForgiven: number,
): { player: Player; reward: number } {
  const reward = gameReward(d, won, errorsForgiven);
  return {
    reward,
    player: { ...p, latas: p.latas + reward, wins: won ? { ...p.wins, [d]: p.wins[d] + 1 } : p.wins },
  };
}

export function finishTutorial(p: Player): Player {
  if (p.tutorialDone) return p;
  return {
    ...p,
    tutorialDone: true,
    rescued: Math.max(p.rescued, 1),
    latas: p.latas + TUTORIAL_REWARD,
    companion: p.companion ?? CATS[0].id,
  };
}

export function nextCatPrice(p: Player): number | null {
  if (p.rescued < 1 || p.rescued >= CATS.length) return null;
  return CAT_PRICES[p.rescued - 1];
}

export function rescueNext(p: Player): Player {
  const price = nextCatPrice(p);
  if (price === null || p.latas < price) return p;
  return { ...p, latas: p.latas - price, rescued: p.rescued + 1 };
}

export function roomPrice(p: Player, r: Room): number | null {
  return ROOM_PRICES[p.rooms[r]] ?? null;
}

export function upgradeRoom(p: Player, r: Room): Player {
  const price = roomPrice(p, r);
  if (price === null || p.latas < price) return p;
  return { ...p, latas: p.latas - price, rooms: { ...p.rooms, [r]: p.rooms[r] + 1 } };
}
