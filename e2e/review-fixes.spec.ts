import { expect, test } from "@playwright/test";
import { hitCat, savedPlayer, seedPlayer, tutorialPlayer, winBoard } from "./helpers";

const noon = (date: string) => new Date(`${date}T12:00:00`);

test.describe("racha cortada por no jugar", () => {
  test("se puede recuperar antes de jugar y la victoria la continúa", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    const base = tutorialPlayer();
    await seedPlayer(page, { ...base, daily: { ...base.daily, streak: 3, lastWonDate: "2026-12-02" } });
    await page.goto("/#/daily");
    await page.getByTestId("daily-recover").click();
    await expect(page.getByTestId("daily-recover")).toHaveCount(0);
    await winBoard(page);
    await expect(page.getByTestId("daily-result")).toBeVisible();
    await expect.poll(async () => (await savedPlayer(page)).daily.streak).toBe(4);
  });
});

test.describe("volver", () => {
  test("volver al refugio no deja la partida en el historial", async ({ page }) => {
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/");
    await page.getByTestId("play-facil").click();
    await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
    await page.getByRole("button", { name: /Volver/ }).click();
    await expect(page.getByTestId("shelter")).toBeVisible();
    await page.goBack();
    await expect(page.locator('[data-testid^="cell-"]')).toHaveCount(0);
  });
});

test.describe("celular de 360 x 640", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  const hardPlayer = () => tutorialPlayer({ companion: "hana", wins: { facil: 3, media: 5, dificil: 0 } });

  test("el modo y el poder se ven sin desplazarse en el tablero difícil", async ({ page }) => {
    await seedPlayer(page, hardPlayer());
    await page.goto("/#/play/dificil");
    await expect(page.getByTestId("mode-flag")).toBeInViewport({ ratio: 1 });
    await expect(page.getByTestId("power-button")).toBeInViewport({ ratio: 1 });
  });

  test("al perder en difícil, la acción se ve entera", async ({ page }) => {
    await seedPlayer(page, hardPlayer());
    await page.goto("/#/play/dificil");
    await hitCat(page);
    await expect(page.getByTestId("result-finish")).toBeInViewport({ ratio: 1 });
  });

  test("al ganar en difícil, la recompensa y las acciones se ven enteras", async ({ page }) => {
    await seedPlayer(page, hardPlayer());
    await page.goto("/#/play/dificil");
    await winBoard(page);
    await expect(page.getByTestId("result-reward")).toBeInViewport({ ratio: 1 });
    await expect(page.getByTestId("result-again")).toBeInViewport({ ratio: 1 });
  });

  test("el modo se ve sin desplazarse en el desafío", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/daily");
    await expect(page.getByTestId("mode-flag")).toBeInViewport({ ratio: 1 });
  });
});
