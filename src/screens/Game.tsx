import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "../app/store";
import { audio } from "../audio";
import reserve from "../data/reserve-boards.json";
import type { Difficulty } from "../economy/balance";
import { CATS } from "../economy/cats";
import { finishGame } from "../economy/player";
import { newGame, reveal, toggleFlag } from "../engine/game";
import { boardWithBudget } from "../engine/generator";
import { applyPower, canUsePower, needsTarget, shieldsFor } from "../engine/powers";
import { mulberry32 } from "../engine/rng";
import type { GameState } from "../engine/types";
import { t } from "../i18n";
import { BoardView, type BoardMode } from "./Board";

const GENERATION_BUDGET_MS = 300;

function Round({ difficulty, onExit, onAgain }: { difficulty: Difficulty; onExit(): void; onAgain(): void }) {
  const update = usePlayer((s) => s.update);
  const companionId = usePlayer((s) => s.player.companion);
  const cat = CATS.find((c) => c.id === companionId) ?? null;
  const power = cat?.power ?? null;
  const rng = useMemo(() => mulberry32((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0), []);

  const [state, setState] = useState<GameState>(() =>
    newGame(boardWithBudget(difficulty, rng, GENERATION_BUDGET_MS, reserve[difficulty]), shieldsFor(power)),
  );
  const [mode, setMode] = useState<BoardMode>("reveal");
  const [powerUsed, setPowerUsed] = useState(false);
  const [targeting, setTargeting] = useState(false);
  const [info, setInfo] = useState<{ row?: number; column?: number } | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const settled = useRef(false);

  const settle = (won: boolean, errors: number) => {
    if (settled.current) return;
    settled.current = true;
    let earned = 0;
    update((p) => {
      const { player, reward: value } = finishGame(p, difficulty, won, errors);
      earned = value;
      return player;
    });
    setReward(earned);
  };

  useEffect(() => {
    if (state.status === "won") settle(true, state.errorsForgiven);
    // settle solo depende de valores estables de esta partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const leave = () => {
    if (state.status === "lost") settle(false, state.errorsForgiven);
    onExit();
  };

  const firePower = (target: number | null) => {
    if (!power) return;
    const result = applyPower(state, power, target, rng);
    audio.play("power");
    setState(result.state);
    setPowerUsed(true);
    setTargeting(false);
    if (result.rowCount !== undefined) setInfo({ row: result.rowCount, column: result.columnCount });
  };

  const powerButton = power && power.id !== "sieteVidas" && state.status === "playing" && (
    <button
      type="button"
      className="btn secondary"
      data-testid="power-button"
      disabled={powerUsed || targeting || !canUsePower(state, power)}
      onClick={() => (needsTarget(power) ? setTargeting(true) : firePower(null))}
    >
      {powerUsed ? t("game.powerUsed") : `${t("game.power", { name: cat!.name })} · ${t(`power.${power.id}.${power.level}`)}`}
    </button>
  );

  const showingSheet = state.status !== "playing" || reward !== null;

  return (
    <main className={showingSheet ? "screen with-sheet" : "screen"}>
      <div className="topbar">
        <button type="button" className="btn ghost" onClick={leave}>
          {t("common.back")}
        </button>
        <strong>{t(`difficulty.${difficulty}`)}</strong>
        <span className="muted" data-testid="cats-left">
          {t("board.catsLeft", { n: Math.max(0, state.board.cats.length - state.flagged.filter(Boolean).length) })}
        </span>
      </div>
      <BoardView
        state={state}
        mode={mode}
        targeting={targeting}
        onModeChange={setMode}
        onReveal={(i) => (targeting ? firePower(i) : setState((s) => reveal(s, i)))}
        onFlag={(i) => setState((s) => toggleFlag(s, i))}
      >
        {powerButton}
        {targeting && (
          <div className="row notice">
            <span>{t("game.pickTarget")}</span>
            <button type="button" className="btn ghost" data-testid="power-cancel" onClick={() => setTargeting(false)}>
              {t("game.cancel")}
            </button>
          </div>
        )}
      </BoardView>
      {info && (
        <p className="notice" data-testid="power-info">
          {t("game.rowCount", { n: info.row ?? 0 })}
          {info.column !== undefined && ` · ${t("game.columnCount", { n: info.column })}`}
        </p>
      )}
      {state.shields > 0 && state.status === "playing" && <p className="muted">{t("game.shields", { n: state.shields })}</p>}

      {state.status === "lost" && reward === null && (
        <section className="card sheet" role="status">
          <h2>{t("result.lost")}</h2>
          <button
            type="button"
            className="btn secondary"
            data-testid="result-finish"
            onClick={() => settle(false, state.errorsForgiven)}
          >
            {t("result.finish")}
          </button>
        </section>
      )}

      {reward !== null && (
        <section className="card sheet" role="status">
          <h2>{t(state.status === "won" ? "result.won" : "result.lost")}</h2>
          <p data-testid="result-reward">{t("result.reward", { n: reward })}</p>
          <div className="row">
            <button type="button" className="btn" data-testid="result-again" onClick={onAgain}>
              {t("result.again")}
            </button>
            <button type="button" className="btn secondary" onClick={onExit}>
              {t("common.toShelter")}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export function Game({ difficulty, onExit }: { difficulty: Difficulty; onExit(): void }) {
  const [round, setRound] = useState(0);
  return <Round key={round} difficulty={difficulty} onExit={onExit} onAgain={() => setRound((r) => r + 1)} />;
}
