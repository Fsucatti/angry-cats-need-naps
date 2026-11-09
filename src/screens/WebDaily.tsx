import { useEffect, useState } from "react";
import { dailyBoard, FIRST_DAILY_DATE } from "../daily/boards";
import { detectLanguage, setLanguage, t } from "../i18n";
import { deviceKeyValue } from "../storage/keyvalue";
import type { GameState } from "../engine/types";
import { BoardView } from "./Board";
import { DailyBoard, DailySummary, ShareButton, type SavedAttempt } from "./DailyPlay";

const kv = deviceKeyValue();

interface WebRecord {
  attempt: SavedAttempt | null;
  result: { won: boolean; timeMs: number } | null;
  final?: GameState;
}

function parseRecord(raw: string | null): WebRecord {
  try {
    const parsed = JSON.parse(raw ?? "null") as WebRecord | null;
    if (parsed && typeof parsed === "object" && "attempt" in parsed && "result" in parsed) return parsed;
  } catch {
    // Un registro dañado equivale a no haber jugado.
  }
  return { attempt: null, result: null };
}

/** Desafío para quien llega por un enlace: sin refugio ni latas. */
export function WebDaily({ date }: { date: string | null }) {
  const key = `refugio.web.${date}`;
  const [record, setRecord] = useState<WebRecord | null>(null);
  const board = date ? dailyBoard(date) : null;

  useEffect(() => {
    setLanguage(detectLanguage(navigator.language));
    void kv.get(key).then((raw) => setRecord(parseRecord(raw)));
  }, [key]);

  const save = (next: WebRecord) => {
    setRecord(next);
    void kv.set(key, JSON.stringify(next));
  };

  if (!date || !board) {
    return (
      <main className="screen padded">
        <p className="notice" data-testid="daily-none">
          {t("daily.none", { date: FIRST_DAILY_DATE })}
        </p>
      </main>
    );
  }

  if (!record) return <main className="screen" />;

  return (
    <main className="screen">
      <div className="topbar">
        <h1>{t("daily.title", { date })}</h1>
      </div>
      {record.result && record.final && (
        <BoardView
          state={record.final}
          mode="reveal"
          readOnly
          onModeChange={() => undefined}
          onReveal={() => undefined}
          onFlag={() => undefined}
        />
      )}
      {record.result ? (
        <section className="card" data-testid="daily-result" role="status">
          <DailySummary won={record.result.won} timeMs={record.result.timeMs} />
          <ShareButton date={date} won={record.result.won} timeMs={record.result.timeMs} streak={record.result.won ? 1 : 0} />
          <a className="btn secondary" data-testid="web-play-game" href="/">
            {t("web.playGame")}
          </a>
        </section>
      ) : (
        <>
          <p className="muted">{t("daily.intro")}</p>
          <DailyBoard
            board={board}
            saved={record.attempt}
            onProgress={(attempt) => save({ attempt, result: null })}
            onFinish={(won, timeMs, final) => save({ attempt: null, result: { won, timeMs }, final })}
          />
        </>
      )}
    </main>
  );
}
