import { useRef, type CSSProperties, type ReactNode } from "react";
import { countAt } from "../engine/board";
import type { GameState } from "../engine/types";
import { useBoardSounds } from "../audio/useBoardSounds";
import { t } from "../i18n";
import { AngryCatFace, PawMark } from "../art/CatSprite";
import "./board.css";

export type BoardMode = "reveal" | "flag";

const LONG_PRESS_MS = 450;

type CellState = "hidden" | "flagged" | "open" | "cat";

function cellState(state: GameState, i: number): CellState {
  if (state.status === "lost" && state.board.cats.includes(i) && !state.flagged[i]) return "cat";
  if (state.revealed[i]) return "open";
  return state.flagged[i] ? "flagged" : "hidden";
}

function cellLabel(state: GameState, i: number, kind: CellState): string {
  const vars = { i: i + 1, n: countAt(state.board, i) };
  if (kind === "open") return t("board.cell.open", vars);
  if (kind === "cat") return t("board.cell.cat", vars);
  return t(kind === "flagged" ? "board.cell.flagged" : "board.cell.hidden", vars);
}

export function BoardView(props: {
  state: GameState;
  onReveal(i: number): void;
  onFlag(i: number): void;
  mode: BoardMode;
  onModeChange(m: BoardMode): void;
  targeting?: boolean;
  readOnly?: boolean;
  children?: ReactNode;
}) {
  const { state, mode, onReveal, onFlag, onModeChange, targeting, readOnly, children } = props;
  const { board } = state;
  useBoardSounds(state, !readOnly);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const pointerKind = useRef("mouse");

  const clearPress = () => {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  // El toque largo es solo táctil: con mouse se marca con el clic derecho.
  const startPress = (i: number, pointerType: string) => {
    longPressed.current = false;
    pointerKind.current = pointerType;
    if (targeting || readOnly || pointerType === "mouse") return;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onFlag(i);
    }, LONG_PRESS_MS);
  };

  const tap = (i: number) => {
    clearPress();
    if (readOnly) return;
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (targeting || mode === "reveal") onReveal(i);
    else onFlag(i);
  };

  return (
    <>
      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`, "--board-ratio": board.width / board.height } as CSSProperties}
        onContextMenu={(event) => event.preventDefault()}
      >
        {state.revealed.map((_, i) => {
          const kind = cellState(state, i);
          const count = countAt(board, i);
          return (
            <button
              key={i}
              type="button"
              className={`cell${targeting ? " targeting" : ""}`}
              data-testid={`cell-${i}`}
              data-state={kind}
              data-hit={state.hitCell === i || undefined}
              data-cat={import.meta.env.DEV ? board.cats.includes(i) : undefined}
              aria-label={cellLabel(state, i, kind)}
              onPointerDown={(event) => startPress(i, event.pointerType)}
              onPointerUp={clearPress}
              onPointerLeave={clearPress}
              onPointerCancel={clearPress}
              onClick={() => tap(i)}
              onContextMenu={(event) => {
                // En táctil, el menú llega después del toque largo, que ya marcó.
                if (!readOnly && !targeting && pointerKind.current === "mouse") onFlag(i);
                event.preventDefault();
              }}
            >
              {kind === "open" && count > 0 && <span className={`n${count}`}>{count}</span>}
              {kind === "flagged" && <PawMark />}
              {kind === "cat" && <AngryCatFace />}
            </button>
          );
        })}
      </div>
      {!readOnly && (
      <div className="controls">
      <div className="mode" role="group">
        <button
          type="button"
          data-testid="mode-reveal"
          aria-pressed={mode === "reveal"}
          onClick={() => onModeChange("reveal")}
        >
          {t("board.reveal")}
        </button>
        <button type="button" data-testid="mode-flag" aria-pressed={mode === "flag"} onClick={() => onModeChange("flag")}>
          {t("board.flag")}
        </button>
      </div>
      {children}
      </div>
      )}
    </>
  );
}
