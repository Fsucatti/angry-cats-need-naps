import { useState } from "react";
import { usePlayer } from "../app/store";
import { CatSprite } from "../art/CatSprite";
import { TUTORIAL_REWARD } from "../economy/balance";
import { finishTutorial } from "../economy/player";
import { forgiveHit, newGame, reveal, toggleFlag } from "../engine/game";
import { TUTORIAL_BOARD } from "../engine/tutorial";
import { t } from "../i18n";
import { BoardView, type BoardMode } from "./Board";

export function Tutorial({ onDone }: { onDone(): void }) {
  const update = usePlayer((s) => s.update);
  const [state, setState] = useState(() => newGame(TUTORIAL_BOARD));
  const [mode, setMode] = useState<BoardMode>("flag");
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  const catsMarked = TUTORIAL_BOARD.cats.every((c) => state.flagged[c]);
  const step = !started ? "tutorial.step1" : catsMarked ? "tutorial.step3" : "tutorial.step2";

  const handleReveal = (i: number) => {
    const next = reveal(state, i);
    if (next.status === "lost") {
      setError(true);
      setState(forgiveHit(next));
      return;
    }
    setError(false);
    setState(next);
    if (next.status === "won") update(finishTutorial);
  };

  if (state.status === "won") {
    return (
      <main className="screen padded under-audio" data-testid="tutorial-won">
        <CatSprite catId="hana" className="hero-cat" />
        <h1>{t("tutorial.won.title")}</h1>
        <p>{t("tutorial.won.body", { n: TUTORIAL_REWARD })}</p>
        <button type="button" className="btn" data-testid="to-shelter" onClick={onDone}>
          {t("common.toShelter")}
        </button>
      </main>
    );
  }

  return (
    <main className="screen under-audio">
      <p className="notice" data-testid="tutorial-step">
        {t(step)}
      </p>
      {!started && (
        <button type="button" className="btn" data-testid="tutorial-next" onClick={() => setStarted(true)}>
          {t("tutorial.step1.next")}
        </button>
      )}
      {error && (
        <p className="notice" data-testid="tutorial-error" role="status">
          {t("tutorial.error")}
        </p>
      )}
      <BoardView
        state={state}
        mode={mode}
        onModeChange={setMode}
        onReveal={handleReveal}
        onFlag={(i) => setState(toggleFlag(state, i))}
      />
    </main>
  );
}
