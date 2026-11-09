import { expect, type Page } from "@playwright/test";
import { finishTutorial, newPlayer, type Player } from "../src/economy/player";

export function tutorialPlayer(patch: Partial<Player> = {}): Player {
  return { ...finishTutorial(newPlayer()), language: "es", latas: 0, ...patch };
}

/** Deja un progreso guardado solo en la primera carga, para no pisarlo al recargar. */
export async function seedPlayer(page: Page, player: Player): Promise<void> {
  await page.addInitScript((raw) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("refugio.progress", raw);
      sessionStorage.setItem("seeded", "1");
    }
  }, JSON.stringify(player));
}

export async function savedPlayer(page: Page): Promise<Player> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("refugio.progress")!));
}

export async function expectLatas(page: Page, latas: number): Promise<void> {
  await expect.poll(async () => (await savedPlayer(page)).latas).toBe(latas);
}

/** Abre todas las casillas seguras. El atributo data-cat solo existe en desarrollo. */
export async function winBoard(page: Page): Promise<void> {
  const safe = page.locator('[data-state="hidden"][data-cat="false"]');
  await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
  while ((await safe.count()) > 0) await safe.first().click();
}

export async function hitCat(page: Page): Promise<void> {
  await page.locator('[data-state="hidden"][data-cat="true"]').first().click();
}
