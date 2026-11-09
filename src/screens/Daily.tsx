import { useEffect, useState } from "react";
import { usePlayer } from "../app/store";
import { useToday } from "../app/useToday";
import { dailyBoard, FIRST_DAILY_DATE } from "../daily/boards";
import { canRecoverStreak, currentStreak, noteMissedDays, recordDaily, recoverStreak } from "../daily/streak";
import { DAILY_REWARD } from "../economy/balance";
import { t } from "../i18n";
import { BoardView } from "./Board";
import { DailyBoard, DailySummary, ShareButton } from "./DailyPlay";
import { LatasBadge } from "./Shelter";

export function Daily({ onBack }: { onBack(): void }) {
  const player = usePlayer((s) => s.player);
  const update = usePlayer((s) => s.update);
  const today = useToday();
  // El intento pertenece a la fecha en que empezó, aunque ya sea otro día.
  const [date, setDate] = useState(() => player.daily.inProgress?.date ?? today);

  useEffect(() => {
    update((p) => noteMissedDays(p, today));
    if (!usePlayer.getState().player.daily.inProgress) setDate(today);
  }, [update, today]);

  const { daily } = player;
  const board = dailyBoard(date);
  const result = daily.results[date];
  const streak = currentStreak(daily, date === today ? today : date);

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" className="btn ghost" onClick={onBack}>
          {t("common.back")}
        </button>
        <h1>{t("daily.title", { date })}</h1>
        <LatasBadge />
      </div>

      {!board && (
        <p className="notice" data-testid="daily-none">
          {t("daily.none", { date: FIRST_DAILY_DATE })}
        </p>
      )}

      {board && canRecoverStreak(daily, today) && (
        <button
          type="button"
          className="btn accent"
          data-testid="daily-recover"
          onClick={() => update((p) => recoverStreak(p, today))}
        >
          {t("daily.recover", { n: daily.brokenStreak })}
        </button>
      )}

      {board && !result && (
        <>
          <p className="muted">{t("daily.intro")}</p>
          <DailyBoard
            board={board}
            saved={daily.inProgress?.date === date ? daily.inProgress : null}
            onProgress={({ state, elapsedMs }) =>
              update((p) => ({ ...p, daily: { ...p.daily, inProgress: { date, state, elapsedMs } } }))
            }
            onFinish={(won, timeMs, state) =>
              update((p) => {
                const next = recordDaily(p, date, won, timeMs);
                return { ...next, daily: { ...next.daily, lastFinal: { date, state } } };
              })
            }
          />
        </>
      )}

      {board && result && daily.lastFinal?.date === date && (
        <BoardView
          state={daily.lastFinal.state}
          mode="reveal"
          readOnly
          onModeChange={() => undefined}
          onReveal={() => undefined}
          onFlag={() => undefined}
        />
      )}

      {board && result && (
        <section className="card" data-testid="daily-result" role="status">
          <DailySummary won={result.won} timeMs={result.timeMs} />
          {result.won && <p>{t("daily.reward", { n: DAILY_REWARD })}</p>}
          <p data-testid="daily-streak">{t("daily.streak", { n: streak })}</p>
          <ShareButton date={date} won={result.won} timeMs={result.timeMs} streak={streak} />
        </section>
      )}
    </main>
  );
}
