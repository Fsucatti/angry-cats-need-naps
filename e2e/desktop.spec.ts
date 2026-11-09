import { expect, test } from "@playwright/test";
import { expectLatas, hitCat, savedPlayer, seedPlayer, tutorialPlayer } from "./helpers";

test.use({ viewport: { width: 1280, height: 720 } });

const hidden = '[data-state="hidden"]';
const noon = (date: string) => new Date(`${date}T12:00:00`);

test("clic derecho marca una casilla", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  const cell = page.locator(hidden).first();
  const id = await cell.getAttribute("data-testid");
  await cell.click({ button: "right" });
  await expect(page.getByTestId(id!)).toHaveAttribute("data-state", "flagged");
  await page.getByTestId(id!).click({ button: "right" });
  await expect(page.getByTestId(id!)).toHaveAttribute("data-state", "hidden");
});

test("clic derecho en una casilla abierta no cambia nada", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  const open = page.locator('[data-state="open"]').first();
  const id = await open.getAttribute("data-testid");
  await open.click({ button: "right" });
  await expect(page.getByTestId(id!)).toHaveAttribute("data-state", "open");
});

test("el tablero difícil y sus controles entran sin desplazarse", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ companion: "hana", wins: { facil: 3, media: 5, dificil: 0 } }));
  await page.goto("/#/play/dificil");
  await expect(page.locator('[data-testid^="cell-"]').first()).toBeInViewport({ ratio: 1 });
  await expect(page.locator('[data-testid^="cell-"]').last()).toBeInViewport({ ratio: 1 });
  await expect(page.getByTestId("power-button")).toBeInViewport({ ratio: 1 });
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight);
  expect(overflow).toBe(false);
});

test("al perder el desafío se ven los gatos del tablero", async ({ page }) => {
  await page.clock.setFixedTime(noon("2026-12-05"));
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/daily");
  await hitCat(page);
  await expect(page.getByTestId("daily-result")).toBeVisible();
  expect(await page.locator('[data-state="cat"]').count()).toBeGreaterThan(0);
  await page.reload();
  expect(await page.locator('[data-state="cat"]').count()).toBeGreaterThan(0);
});

test("se puede cancelar la elección de casilla de un poder", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ rescued: 4, companion: "sasha" }));
  await page.goto("/#/play/facil");
  await page.getByTestId("power-button").click();
  await page.getByTestId("power-cancel").click();
  await expect(page.getByTestId("power-button")).toBeEnabled();
  await expect(page.getByTestId("power-cancel")).toHaveCount(0);
});

test("salir de un tablero perdido con Volver entrega las 5 latas", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  await hitCat(page);
  await page.getByRole("button", { name: "Volver" }).click();
  await expect(page.getByTestId("shelter")).toBeVisible();
  await expectLatas(page, 5);
});

test("el contador de gatos no baja de cero", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  const cells = page.locator(hidden);
  for (let i = 0; i < 9 && (await cells.count()) > 0; i++) await cells.first().click({ button: "right" });
  await expect(page.getByTestId("cats-left")).toBeVisible();
  await expect(page.getByTestId("cats-left")).not.toContainText("-");
});

test("el tiempo del desafío no suma con la página cerrada", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-12-05T10:00:00"));
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/daily");
  const safe = page.locator('[data-state="hidden"][data-cat="false"]');
  await page.clock.setFixedTime(new Date("2026-12-05T10:00:30"));
  await safe.first().click();
  await expect
    .poll(async () => (await savedPlayer(page)).daily.inProgress?.elapsedMs ?? 0)
    .toBe(30000);
  await page.clock.setFixedTime(new Date("2026-12-05T18:00:00"));
  await page.reload();
  await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-12-05T18:00:10"));
  await hitCat(page);
  await expect.poll(async () => (await savedPlayer(page)).daily.results["2026-12-05"]?.timeMs).toBe(40000);
});

test("el refugio muestra la fecha nueva al volver a la pestaña", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-12-05T23:50:00"));
  const base = tutorialPlayer();
  await seedPlayer(page, { ...base, daily: { ...base.daily, results: { "2026-12-05": { won: true, timeMs: 1 } } } });
  await page.goto("/");
  await expect(page.getByTestId("open-daily")).toContainText("completado");
  await page.clock.setFixedTime(new Date("2026-12-06T00:10:00"));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByTestId("open-daily")).not.toContainText("completado");
});
