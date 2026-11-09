export type Difficulty = "facil" | "media" | "dificil";

export const DIFFICULTIES: Record<Difficulty, { width: number; height: number; cats: number }> = {
  facil: { width: 8, height: 8, cats: 8 },
  media: { width: 9, height: 12, cats: 18 },
  dificil: { width: 10, height: 14, cats: 32 },
};

export const WIN_REWARD: Record<Difficulty, number> = { facil: 20, media: 35, dificil: 60 };
export const PERFECT_MULTIPLIER = 1.25;
export const LOSS_REWARD = 5;
export const DAILY_REWARD = 40;
export const TUTORIAL_REWARD = 50;

/** Del segundo al décimo gato: el primero se rescata gratis en el tutorial. */
export const CAT_PRICES = [40, 60, 80, 100, 130, 160, 200, 240, 290];
export const ROOM_PRICES = [50, 100, 180];

export const WINS_TO_UNLOCK_MEDIA = 3;
export const WINS_TO_UNLOCK_DIFICIL = 5;

export const STREAK_RECOVERY_DAYS = 7;
