import { expect, test, type Page } from "@playwright/test";

const cell = (page: Page, i: number) => page.getByTestId(`cell-${i}`);

test.describe("tutorial", () => {
  test("enseña las reglas y rescata a Hana", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("tutorial-step")).toContainText(/número|number/i);
    await page.getByTestId("tutorial-next").click();

    await page.getByTestId("mode-flag").click();
    await cell(page, 3).click();
    await cell(page, 14).click();
    await expect(cell(page, 3)).toHaveAttribute("data-state", "flagged");

    await page.getByTestId("mode-reveal").click();
    await cell(page, 4).click();
    await cell(page, 9).click();

    await expect(page.getByTestId("tutorial-won")).toContainText("Hana");
    await page.getByTestId("to-shelter").click();
    await expect(page.getByTestId("cat-hana")).toBeVisible();
  });

  test("revelar un gato avisa y no termina el tutorial", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tutorial-next").click();
    await page.getByTestId("mode-reveal").click();
    await cell(page, 3).click();
    await expect(page.getByTestId("tutorial-error")).toBeVisible();
    await expect(cell(page, 3)).toHaveAttribute("data-state", "flagged");
  });
});

test.describe("celular chico", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("el tablero difícil entra sin scroll horizontal y con casillas de 30 px", async ({ page }) => {
    await page.goto("/#/board-preview/dificil");
    await expect(cell(page, 0)).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(360);
    const box = await cell(page, 0).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(30);
    expect(box!.height).toBeGreaterThanOrEqual(30);
  });

  test("en modo marcar, un toque marca y no revela", async ({ page }) => {
    await page.goto("/#/board-preview/dificil");
    await page.getByTestId("mode-flag").click();
    const hidden = page.locator('[data-state="hidden"]').first();
    const id = await hidden.getAttribute("data-testid");
    await hidden.click();
    await expect(page.getByTestId(id!)).toHaveAttribute("data-state", "flagged");
  });
});
