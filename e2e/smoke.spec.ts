import { expect, test } from "@playwright/test";

test("abre la app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-root")).toBeVisible();
});
