import { useEffect, useRef } from "react";
import type { GameState } from "../engine/types";
import { audio } from ".";

const CASCADE_CELLS = 4;

const count = (values: boolean[]) => values.filter(Boolean).length;

/** Elige el sonido comparando el tablero con el anterior, sin importar qué causó el cambio. */
export function useBoardSounds(state: GameState, enabled: boolean): void {
  const previous = useRef(state);

  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (!enabled || before === state) return;

    if (state.status === "lost" || state.errorsForgiven > before.errorsForgiven) {
      audio.play("hit");
    } else if (state.status === "won" && before.status !== "won") {
      audio.play("win");
    } else {
      const opened = count(state.revealed) - count(before.revealed);
      const flags = count(state.flagged) - count(before.flagged);
      if (opened >= CASCADE_CELLS) audio.play("cascade");
      else if (opened > 0) audio.play("reveal");
      else if (flags > 0) audio.play("flag");
      else if (flags < 0) audio.play("unflag");
    }
  }, [state, enabled]);
}
