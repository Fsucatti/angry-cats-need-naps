import { usePlayer } from "../app/store";
import { audio } from "../audio";
import { useToday } from "../app/useToday";
import { useTapGuard } from "../app/useTapGuard";
import { CatSprite } from "../art/CatSprite";
import { Room } from "../art/Room";
import { WINS_TO_UNLOCK_DIFICIL, WINS_TO_UNLOCK_MEDIA, type Difficulty } from "../economy/balance";
import { CATS } from "../economy/cats";
import { isUnlocked, roomPrice, upgradeRoom, type Room as RoomName } from "../economy/player";
import { getLanguage, t } from "../i18n";
import "./board.css";

const ROOMS: RoomName[] = ["entrada", "patio", "dormitorio"];
const LEVELS: Difficulty[] = ["facil", "media", "dificil"];
const UNLOCK_WINS: Partial<Record<Difficulty, number>> = { media: WINS_TO_UNLOCK_MEDIA, dificil: WINS_TO_UNLOCK_DIFICIL };

export function LatasBadge() {
  const latas = usePlayer((s) => s.player.latas);
  return (
    <span className="latas" data-testid="latas-count" aria-label={t("latas.count", { n: latas })}>
      {latas}
    </span>
  );
}

export function Shelter(props: { onPlay(d: Difficulty): void; onCats(): void; onDaily(): void }) {
  const player = usePlayer((s) => s.player);
  const update = usePlayer((s) => s.update);
  const notice = usePlayer((s) => s.loadNotice);
  const guard = useTapGuard();
  const today = useToday();
  const dailyDone = player.daily.results[today] !== undefined;
  const rescued = CATS.slice(0, player.rescued);

  return (
    <main className="screen wide" data-testid="shelter">
      <div className="topbar">
        <h1>{t("shelter.title")}</h1>
        <LatasBadge />
      </div>

      {notice && (
        <p className="notice" data-testid="load-notice" role="status">
          {t(`shelter.notice.${notice}`)}
        </p>
      )}

      <button type="button" className="btn" data-testid="open-daily" onClick={props.onDaily}>
        {t(dailyDone ? "shelter.dailyDone" : "shelter.daily")}
      </button>

      <section className="card">
        <h2>{t("shelter.play")}</h2>
        <div className="levels">
          {LEVELS.map((level) => {
            const unlocked = isUnlocked(player, level);
            return (
              <button
                key={level}
                type="button"
                className={`btn${unlocked ? "" : " secondary"}`}
                data-testid={`play-${level}`}
                disabled={!unlocked}
                onClick={() => props.onPlay(level)}
              >
                {t(`difficulty.${level}`)}
                {!unlocked && <span className="small">{t(`difficulty.unlock.${level}`, { n: UNLOCK_WINS[level] ?? 0 })}</span>}
              </button>
            );
          })}
        </div>
      </section>

      {ROOMS.map((room, roomIndex) => {
        const level = player.rooms[room];
        const price = roomPrice(player, room);
        const cats = rescued.filter((_, i) => i % ROOMS.length === roomIndex);
        return (
          <section key={room} className="card room">
            <Room room={room} level={level}>
              {cats.map((cat) => (
                <CatSprite key={cat.id} catId={cat.id} pose={room === "dormitorio" ? "sleep" : "sit"} className={room === "dormitorio" ? "in-room sleeping" : "in-room"} />
              ))}
            </Room>
            <div className="room-body">
              <div>
                <h2>{t(`room.${room}`)}</h2>
                <span className="muted" data-testid={`room-level-${room}`}>
                  {t("shelter.level", { level })}
                </span>
              </div>
              {price === null ? (
                <strong>{t("shelter.maxed")}</strong>
              ) : (
                <button
                  type="button"
                  className="btn"
                  data-testid={`upgrade-${room}`}
                  disabled={player.latas < price}
                  onClick={() =>
                    guard(() => {
                      update((p) => upgradeRoom(p, room));
                      audio.play("buy");
                    })
                  }
                >
                  {t("shelter.upgrade", { price })}
                </button>
              )}
            </div>
          </section>
        );
      })}

      <div className="row">
        <button type="button" className="btn secondary" data-testid="open-cats" onClick={props.onCats}>
          {t("shelter.cats")} · {player.rescued}/{CATS.length}
        </button>
        <button
          type="button"
          className="btn ghost"
          data-testid="language-toggle"
          onClick={() => update((p) => ({ ...p, language: getLanguage() === "es" ? "en" : "es" }))}
        >
          {t("common.language")}
        </button>
      </div>
    </main>
  );
}
