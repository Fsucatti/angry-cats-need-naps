const COPY = {
  es: { won: "Gané", lost: "Perdí", streak: "Racha" },
  en: { won: "Won", lost: "Lost", streak: "Streak" },
};

export function formatTime(timeMs: number): string {
  const seconds = Math.floor(timeMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function shareText(args: {
  date: string;
  won: boolean;
  timeMs: number;
  streak: number;
  url: string;
  lang: "es" | "en";
}): string {
  const copy = COPY[args.lang];
  return [
    `Angry Cats Need Naps Too ${args.date}`,
    `${args.won ? `😺 ${copy.won}` : `😾 ${copy.lost}`} · ${formatTime(args.timeMs)}`,
    `🔥 ${copy.streak}: ${args.streak}`,
    args.url,
  ].join("\n");
}
