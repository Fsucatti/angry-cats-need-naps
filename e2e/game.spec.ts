import { expect, test } from "@playwright/test";
import { expectLatas, hitCat, seedPlayer, tutorialPlayer, winBoard } from "./helpers";

test("ganar da la recompensa una sola vez", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  await winBoard(page);
  await expect(page.getByTestId("result-reward")).toContainText("25");
  await expectLatas(page, 25);
  await page.reload();
  await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
  await expectLatas(page, 25);
});

test("perder ofrece terminar y da 5 latas", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/facil");
  await hitCat(page);
  await page.getByTestId("result-finish").click();
  await expect(page.getByTestId("result-reward")).toContainText("5");
  await expectLatas(page, 5);
});

test("ganar con un error perdonado por Freya no da el bono", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ rescued: 3, companion: "freya" }));
  await page.goto("/#/play/facil");
  await hitCat(page);
  await expect(page.getByTestId("result-finish")).toHaveCount(0);
  await winBoard(page);
  await expectLatas(page, 20);
});

test("el poder se puede usar una sola vez", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ companion: "hana" }));
  await page.goto("/#/play/facil");
  await page.getByTestId("power-button").click();
  await expect(page.getByTestId("power-button")).toBeDisabled();
});

test("Oído fino pide una casilla y muestra la cuenta", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ rescued: 4, companion: "sasha" }));
  await page.goto("/#/play/facil");
  await page.getByTestId("power-button").click();
  await page.locator('[data-testid^="cell-"]').first().click();
  await expect(page.getByTestId("power-info")).toBeVisible();
  await expect(page.getByTestId("power-button")).toBeDisabled();
});

test("una dificultad bloqueada no se puede jugar por enlace", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/#/play/dificil");
  await expect(page.getByTestId("shelter")).toBeVisible();
});
