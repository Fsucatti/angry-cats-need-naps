import { expect, test } from "@playwright/test";
import { winBoard } from "./helpers";

const noon = (date: string) => new Date(`${date}T12:00:00`);
const cells = '[data-testid^="cell-"]';

test("la raíz abre el juego completo con el tutorial", async ({ page }) => {
  await page.clock.setFixedTime(noon("2026-12-05"));
  await page.goto("/");
  await expect(page.getByTestId("tutorial-step")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("el enlace del desafío evita el tutorial y retoma al recargar", async ({ page }) => {
  await page.clock.setFixedTime(noon("2026-12-05"));
  await page.goto("/d/2026-12-05");
  await expect(page.getByTestId("tutorial-step")).toHaveCount(0);
  const safe = page.locator('[data-state="hidden"][data-cat="false"]');
  const target = await safe.first().getAttribute("data-testid");
  await safe.first().click();
  await page.reload();
  await expect(page.getByTestId(target!)).toHaveAttribute("data-state", "open");
});

test("al terminar el desafío invita a jugar el juego completo", async ({ page }) => {
  await page.clock.setFixedTime(noon("2026-12-05"));
  await page.goto("/d/2026-12-05");
  await winBoard(page);
  await page.getByTestId("web-play-game").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("tutorial-step")).toBeVisible();
});

test("una fecha anterior al primer tablero redirige a hoy", async ({ page }) => {
  await page.clock.setFixedTime(noon("2026-12-05"));
  await page.goto("/d/2026-11-08");
  await expect(page).toHaveURL(/\/d\/2026-12-05$/);
  await expect(page.locator(cells).first()).toBeVisible();
});

test("el primer tablero es del 9 de noviembre", async ({ page }) => {
  await page.clock.setFixedTime(noon("2026-12-05"));
  await page.goto("/d/2026-11-09");
  await expect(page).toHaveURL(/\/d\/2026-11-09$/);
  await expect(page.locator(cells).first()).toBeVisible();
});
