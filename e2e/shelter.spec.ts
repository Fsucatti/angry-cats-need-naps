import { expect, test } from "@playwright/test";
import { expectLatas, savedPlayer, seedPlayer, tutorialPlayer } from "./helpers";

test("la primera apertura va al tutorial", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("tutorial-step")).toBeVisible();
});

test("con 50 latas, mejorar la entrada sube su nivel y deja 0", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ latas: 50 }));
  await page.goto("/");
  await page.getByTestId("upgrade-entrada").click();
  await expect(page.getByTestId("room-level-entrada")).toContainText("1");
  await expectLatas(page, 0);
});

test("sin latas, los botones quedan deshabilitados y muestran el precio", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ latas: 0 }));
  await page.goto("/");
  await expect(page.getByTestId("upgrade-patio")).toBeDisabled();
  await expect(page.getByTestId("upgrade-patio")).toContainText("50");
});

test("doble toque en mejorar descuenta una sola vez", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ latas: 500 }));
  await page.goto("/");
  await page.getByTestId("upgrade-entrada").dblclick();
  await expectLatas(page, 450);
});

test("doble toque en rescatar descuenta una sola vez", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ latas: 500 }));
  await page.goto("/#/cats");
  await page.getByTestId("rescue-button").dblclick();
  await expectLatas(page, 460);
  await expect.poll(async () => (await savedPlayer(page)).rescued).toBe(2);
});

test("con todo comprado, la pantalla lo indica y no ofrece comprar", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ latas: 9999, rescued: 10, rooms: { entrada: 3, patio: 3, dormitorio: 3 } }));
  await page.goto("/");
  await expect(page.getByTestId("upgrade-entrada")).toHaveCount(0);
  await expect(page.getByText("Sala completa").first()).toBeVisible();
  await page.goto("/#/cats");
  await expect(page.getByTestId("rescue-button")).toHaveCount(0);
  await expect(page.getByText("Rescataste a todos los gatos")).toBeVisible();
});

test("el gato acompañante persiste al recargar", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer({ rescued: 2 }));
  await page.goto("/#/cats");
  await page.getByTestId("choose-luca").click();
  await page.reload();
  await expect(page.getByTestId("choose-luca")).toHaveAttribute("aria-pressed", "true");
});

test("una dificultad bloqueada no se ofrece", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/");
  await expect(page.getByTestId("play-facil")).toBeEnabled();
  await expect(page.getByTestId("play-dificil")).toBeDisabled();
});

test("avisa si el progreso se recuperó del respaldo", async ({ page }) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("refugio.progress", "{roto");
    localStorage.setItem("refugio.progress.backup", backup);
  }, JSON.stringify(tutorialPlayer({ latas: 7 })));
  await page.goto("/");
  await expect(page.getByTestId("load-notice")).toBeVisible();
});

test("avisa si tuvo que empezar de nuevo", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("refugio.progress", "{roto");
    localStorage.setItem("refugio.progress.backup", "{roto");
  });
  await page.goto("/");
  await expect(page.getByTestId("tutorial-step")).toBeVisible();
});

test("cambiar de idioma persiste", async ({ page }) => {
  await seedPlayer(page, tutorialPlayer());
  await page.goto("/");
  await page.getByTestId("language-toggle").click();
  await expect(page.getByTestId("shelter")).toContainText("Your shelter");
  await page.reload();
  await expect(page.getByTestId("shelter")).toContainText("Your shelter");
});
