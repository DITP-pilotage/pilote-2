import { test, expect } from "@playwright/test";

test.describe("Écran de choix du mode de connexion", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("le bouton Se connecter de la landing ouvre l'écran de choix", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Se connecter" }).first().click();

    await expect(page).toHaveURL(/\/connexion/);
    await expect(
      page.getByRole("heading", { name: "Connexion à PILOTE" }),
    ).toBeVisible();
  });

  test("le parcours mot de passe reste accessible depuis l'écran de choix", async ({
    page,
  }) => {
    await page.goto("/connexion");

    await expect(
      page.getByRole("button", {
        name: "Se connecter avec une adresse électronique et un mot de passe",
      }),
    ).toBeVisible();
  });

  test("un refus affiche une explication et le contact d'assistance", async ({
    page,
  }) => {
    await page.goto("/connexion?motif=compte_desactive");

    await expect(page.getByRole("alert")).toContainText("désactivé");
    await expect(page.getByRole("alert")).toContainText(
      "pilote@modernisation.gouv.fr",
    );
    await expect(
      page.getByRole("button", {
        name: "Se connecter avec une adresse électronique et un mot de passe",
      }),
    ).toBeVisible();
  });

  test("une page protégée redirige vers l'écran de choix en conservant la destination", async ({
    page,
  }) => {
    await page.goto("/accueil/chantier/NAT-FR");

    await expect(page).toHaveURL(
      /\/connexion\?callbackUrl=%2Faccueil%2Fchantier%2FNAT-FR/,
    );
  });
});
