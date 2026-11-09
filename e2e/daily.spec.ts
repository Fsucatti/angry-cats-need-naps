import { expect, test } from "@playwright/test";
import { expectLatas, hitCat, savedPlayer, seedPlayer, tutorialPlayer, winBoard } from "./helpers";

const noon = (date: string) => new Date(`${date}T12:00:00`);

test.describe("en la app", () => {
  test("ganar da 40 latas y racha, y no se puede repetir", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/daily");
    await expect(page.getByTestId("power-button")).toHaveCount(0);
    await winBoard(page);
    await expect(page.getByTestId("daily-result")).toBeVisible();
    await expectLatas(page, 40);
    expect((await savedPlayer(page)).daily.streak).toBe(1);
    await page.reload();
    await expect(page.getByTestId("daily-result")).toBeVisible();
    await expect(page.getByTestId("mode-flag")).toHaveCount(0);
    await expectLatas(page, 40);
  });

  test("antes del primer desafío avisa cuándo llega", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-11-01"));
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/daily");
    await expect(page.getByTestId("daily-none")).toBeVisible();
  });

  test("perder ofrece recuperar la racha", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    const base = tutorialPlayer();
    await seedPlayer(page, { ...base, daily: { ...base.daily, streak: 3, lastWonDate: "2026-12-04" } });
    await page.goto("/#/daily");
    await hitCat(page);
    await page.getByTestId("daily-recover").click();
    await expect(page.getByTestId("daily-streak")).toContainText("3");
    await expect(page.getByTestId("daily-recover")).toHaveCount(0);
    await expect.poll(async () => (await savedPlayer(page)).daily.lastRecoveryDate).toBe("2026-12-05");
  });

  test("recargar en medio del desafío retoma el mismo intento", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/daily");
    const safe = page.locator('[data-state="hidden"][data-cat="false"]');
    const target = await safe.first().getAttribute("data-testid");
    await safe.first().click();
    await expect(page.getByTestId(target!)).toHaveAttribute("data-state", "open");
    await expect.poll(async () => (await savedPlayer(page)).daily.inProgress?.state.revealed.filter(Boolean).length ?? 0).toBeGreaterThan(0);
    await page.reload();
    await expect(page.getByTestId(target!)).toHaveAttribute("data-state", "open");
  });

  test("cerrar después de perder no regala otro intento", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/daily");
    await hitCat(page);
    await expect(page.getByTestId("daily-result")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("daily-result")).toBeVisible();
  });

  test("empezar antes de medianoche y terminar después guarda la fecha inicial", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-05T23:59:00"));
    await seedPlayer(page, tutorialPlayer());
    await page.goto("/#/daily");
    await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
    await page.clock.setFixedTime(new Date("2026-12-06T00:01:00"));
    await winBoard(page);
    await expect(page.getByTestId("daily-result")).toBeVisible();
    await expect.poll(async () => Object.keys((await savedPlayer(page)).daily.results)).toEqual(["2026-12-05"]);
    expect((await savedPlayer(page)).daily.results["2026-12-05"].timeMs).toBe(120000);
  });
});

test.describe("en la web", () => {
  test("muestra el desafío, sin refugio, latas ni poderes", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await page.goto("/d/2026-12-05");
    await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
    await expect(page.getByTestId("latas-count")).toHaveCount(0);
    await expect(page.getByTestId("shelter")).toHaveCount(0);
    await expect(page.getByTestId("power-button")).toHaveCount(0);
  });

  for (const path of ["/d/2026-12-09", "/d/2026-01-01", "/d/hola"]) {
    test(`${path} redirige al desafío de hoy`, async ({ page }) => {
      await page.clock.setFixedTime(noon("2026-12-05"));
      await page.goto(path);
      await expect(page).toHaveURL(/\/d\/2026-12-05$/);
    });
  }

  test("una fecha pasada abre su propio tablero", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await page.goto("/d/2026-12-02");
    await expect(page).toHaveURL(/\/d\/2026-12-02$/);
    await expect(page.locator('[data-testid^="cell-"]').first()).toBeVisible();
  });

  test("copia el resumen con el enlace e impide repetir al recargar", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.clock.setFixedTime(noon("2026-12-05"));
    await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
    await page.goto("/d/2026-12-05");
    await winBoard(page);
    await page.getByTestId("daily-share").click();
    await expect(page.getByTestId("daily-share")).toContainText(/Copi|Copied/);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("/d/2026-12-05");
    await page.reload();
    await expect(page.getByTestId("daily-result")).toBeVisible();
    await expect(page.getByTestId("mode-flag")).toHaveCount(0);
  });

  test("recargar en medio retoma el mismo intento", async ({ page }) => {
    await page.clock.setFixedTime(noon("2026-12-05"));
    await page.goto("/d/2026-12-05");
    const safe = page.locator('[data-state="hidden"][data-cat="false"]');
    const target = await safe.first().getAttribute("data-testid");
    await safe.first().click();
    await page.reload();
    await expect(page.getByTestId(target!)).toHaveAttribute("data-state", "open");
  });
});
