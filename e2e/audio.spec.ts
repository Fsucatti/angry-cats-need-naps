import { expect, test, type Page } from "@playwright/test";
import { hitCat, seedPlayer, tutorialPlayer } from "./helpers";

const sounds = (page: Page) => page.evaluate(() => window.__refugioSounds ?? []);

test("el control aparece en el refugio, la partida, el tutorial y la web del desafío", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-12-05T12:00:00"));
  await page.goto("/");
  await expect(page.getByTestId("audio-button")).toBeVisible();
  await page.goto("/d/2026-12-05");
  await expect(page.getByTestId("audio-button")).toBeVisible();
});

test("el control no tapa los datos en el refugio ni en una partida", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/");
  await expect(page.getByTestId("latas-count")).toBeVisible();
  const audio = await page.getByTestId("audio-button").boundingBox();
  const latas = await page.getByTestId("latas-count").boundingBox();
  expect(latas!.x + latas!.width).toBeLessThanOrEqual(audio!.x);
});

test("los ajustes se guardan al recargar", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/");
  await page.getByTestId("audio-button").click();
  await page.getByTestId("audio-sfx").fill("25");
  await page.getByTestId("audio-music").fill("0");
  await page.getByTestId("audio-mute").click();
  await page.reload();
  await page.getByTestId("audio-button").click();
  await expect(page.getByTestId("audio-sfx")).toHaveValue("25");
  await expect(page.getByTestId("audio-music")).toHaveValue("0");
  await expect(page.getByTestId("audio-mute")).toHaveAttribute("aria-pressed", "true");
});

test("revelar y despertar un gato suenan", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  await page.locator('[data-state="hidden"][data-cat="false"]').first().click();
  await expect.poll(async () => (await sounds(page)).some((s) => s === "reveal" || s === "cascade")).toBe(true);
  await hitCat(page);
  await expect.poll(async () => sounds(page)).toContain("hit");
});

test("marcar y desmarcar tienen sonidos distintos", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  const cell = page.locator('[data-state="hidden"]').first();
  const id = await cell.getAttribute("data-testid");
  await cell.click({ button: "right" });
  await page.getByTestId(id!).click({ button: "right" });
  await expect.poll(async () => sounds(page)).toEqual(expect.arrayContaining(["flag", "unflag"]));
});

test("en silencio no suena nada", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  await page.getByTestId("audio-button").click();
  await page.getByTestId("audio-mute").click();
  await page.getByTestId("audio-button").click();
  await page.evaluate(() => {
    window.__refugioSounds = [];
  });
  await page.locator('[data-state="hidden"]').first().click({ button: "right" });
  await page.waitForTimeout(100);
  expect(await sounds(page)).toEqual([]);
});

test("comprar y rescatar suenan", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ latas: 500 }));
  await page.goto("/");
  await page.getByTestId("upgrade-entrada").click();
  await expect.poll(async () => sounds(page)).toContain("buy");
  await page.goto("/#/cats");
  await page.getByTestId("rescue-button").click();
  await expect.poll(async () => sounds(page)).toContain("rescue");
});

test("sin soporte de audio el juego sigue funcionando", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { value: undefined });
  });
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  await hitCat(page);
  await expect(page.getByTestId("result-finish")).toBeVisible();
  expect(errors).toEqual([]);
});
