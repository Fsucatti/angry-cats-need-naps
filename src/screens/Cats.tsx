import { usePlayer } from "../app/store";
import { audio } from "../audio";
import { useTapGuard } from "../app/useTapGuard";
import { CatSprite } from "../art/CatSprite";
import { CATS } from "../economy/cats";
import { nextCatPrice, rescueNext } from "../economy/player";
import { t } from "../i18n";
import { LatasBadge } from "./Shelter";

export function Cats({ onBack }: { onBack(): void }) {
  const player = usePlayer((s) => s.player);
  const update = usePlayer((s) => s.update);
  const guard = useTapGuard();
  const price = nextCatPrice(player);
  const next = CATS[player.rescued];

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" className="btn ghost" onClick={onBack}>
          {t("common.back")}
        </button>
        <h1>{t("cats.title")}</h1>
        <LatasBadge />
      </div>

      {price !== null && next ? (
        <section className="card cat-row">
          <CatSprite catId={next.id} className="silhouette" />
          <div>
            <h2>{t("cats.next")}</h2>
            <p className="muted">{t(`power.${next.power.id}.${next.power.level}`)}</p>
            <button
              type="button"
              className="btn"
              data-testid="rescue-button"
              disabled={player.latas < price}
              onClick={() =>
                guard(() => {
                  update(rescueNext);
                  audio.play("rescue");
                })
              }
            >
              {t("cats.rescue", { price })}
            </button>
          </div>
        </section>
      ) : (
        <p className="notice">{t("cats.allRescued")}</p>
      )}

      {CATS.slice(0, player.rescued).map((cat) => {
        const chosen = player.companion === cat.id;
        return (
          <section key={cat.id} className="card cat-row">
            <CatSprite catId={cat.id} />
            <div>
              <h2>{cat.name}</h2>
              <p className="muted">{t(`power.${cat.power.id}.${cat.power.level}`)}</p>
              <button
                type="button"
                className={`btn ${chosen ? "accent" : "secondary"}`}
                data-testid={`choose-${cat.id}`}
                aria-pressed={chosen}
                onClick={() => update((p) => ({ ...p, companion: cat.id }))}
              >
                {t(chosen ? "cats.chosen" : "cats.choose")}
              </button>
            </div>
          </section>
        );
      })}
    </main>
  );
}
