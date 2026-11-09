import { useEffect, useRef, useState } from "react";
import { PUBLIC_URL, shareResult } from "../app/share";
import { formatTime, shareText } from "../daily/share";
import { newGame, reveal, toggleFlag } from "../engine/game";
import type { Board, GameState } from "../engine/types";
import { getLanguage, t } from "../i18n";
import { BoardView, type BoardMode } from "./Board";

export interface SavedAttempt {
  state: GameState;
  elapsedMs: number;
}

/** Cuenta el tiempo solo mientras la pestaña está visible. */
function useVisibleTimer(initialMs: number): () => number {
  const accumulated = useRef(initialMs);
  const since = useRef<number | null>(document.hidden ? null : Date.now());

  useEffect(() => {
    const onChange = () => {
      if (document.hidden) {
        if (since.current !== null) accumulated.current += Date.now() - since.current;
        since.current = null;
      } else if (since.current === null) {
        since.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return () => accumulated.current + (since.current === null ? 0 : Date.now() - since.current);
}

/** Tablero del desafío: guarda cada jugada para retomar el mismo intento. */
export function DailyBoard(props: {
  board: Board;
  saved: SavedAttempt | null;
  onProgress(attempt: SavedAttempt): void;
  onFinish(won: boolean, timeMs: number, finalState: GameState): void;
}) {
  const { board, saved, onProgress, onFinish } = props;
  const [state, setState] = useState<GameState>(() => saved?.state ?? newGame(board));
  const [mode, setMode] = useState<BoardMode>("reveal");
  const elapsed = useVisibleTimer(saved?.elapsedMs ?? 0);
  const finished = useRef(false);

  useEffect(() => {
    if (state.status === "playing") {
      onProgress({ state, elapsedMs: elapsed() });
    } else if (!finished.current) {
      finished.current = true;
      onFinish(state.status === "won", elapsed(), state);
    }
    // Las funciones de props cambian en cada render; importa el estado del tablero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <BoardView
      state={state}
      mode={mode}
      onModeChange={setMode}
      onReveal={(i) => setState((s) => reveal(s, i))}
      onFlag={(i) => setState((s) => toggleFlag(s, i))}
    />
  );
}

export function ShareButton(props: { date: string; won: boolean; timeMs: number; streak: number }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const text = shareText({ ...props, url: `${PUBLIC_URL}/d/${props.date}`, lang: getLanguage() });
    if ((await shareResult(text)) === "copied") setCopied(true);
  };
  return (
    <button type="button" className="btn" data-testid="daily-share" onClick={() => void share()}>
      {t(copied ? "daily.copied" : "daily.share")}
    </button>
  );
}

export function DailySummary({ won, timeMs }: { won: boolean; timeMs: number }) {
  return (
    <>
      <h2>{t(won ? "daily.won" : "daily.lost")}</h2>
      <p>{t("daily.time", { time: formatTime(timeMs) })}</p>
    </>
  );
}
