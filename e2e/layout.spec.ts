import { expect, test, type Page } from "@playwright/test";
import { hitCat, seedPlayer, tutorialPlayer, winBoard } from "./helpers";

const hardPlayer = () => tutorialPlayer({ wins: { facil: 3, media: 5, dificil: 0 } });
const cells = (page: Page) => page.locator('[data-testid^="cell-"]');

async function expectLastRowClearOfSheet(page: Page) {
  const last = cells(page).last();
  await last.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const cell = (await last.boundingBox())!;
  const sheet = (await page.locator(".sheet").boundingBox())!;
  expect(cell.y + cell.height).toBeLessThanOrEqual(sheet.y);
}

test.describe("celular girado y ventanas bajas", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("el tablero difícil sigue siendo jugable", async ({ page }) => {
    await seedPlayer(page, hardPlayer());
    await page.goto("/#/play/dificil");
    const box = (await cells(page).first().boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(30);
  });
});

test.describe("resultado en un celular", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("al perder se pueden ver las últimas filas", async ({ page }) => {
    await seedPlayer(page, hardPlayer());
    await page.goto("/#/play/dificil");
    await hitCat(page);
    await expect(page.locator(".sheet")).toBeVisible();
    await expectLastRowClearOfSheet(page);
  });

  test("al ganar se pueden ver las últimas filas", async ({ page }) => {
    await seedPlayer(page, hardPlayer());
    await page.goto("/#/play/dificil");
    await winBoard(page);
    await expect(page.getByTestId("result-reward")).toBeVisible();
    await expectLastRowClearOfSheet(page);
  });

  test("las imágenes de las casillas no abren el menú del sistema", async ({ page }) => {
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/play/facil");
    await page.locator('[data-state="hidden"]').first().click({ button: "right" });
    const icon = page.locator('[data-state="flagged"] img').first();
    await expect(icon).toHaveCSS("pointer-events", "none");
  });
});

test.describe("panel de sonido", () => {
  test("se cierra con Escape", async ({ page }) => {
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/");
    await page.getByTestId("audio-button").click();
    await expect(page.getByTestId("audio-sfx")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("audio-sfx")).toHaveCount(0);
  });

  test("se cierra al tocar afuera, y tocar adentro no lo cierra", async ({ page }) => {
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/");
    await page.getByTestId("audio-button").click();
    await page.getByTestId("audio-mute").click();
    await expect(page.getByTestId("audio-sfx")).toBeVisible();
    await page.getByTestId("shelter").locator("h1").click();
    await expect(page.getByTestId("audio-sfx")).toHaveCount(0);
  });
});
