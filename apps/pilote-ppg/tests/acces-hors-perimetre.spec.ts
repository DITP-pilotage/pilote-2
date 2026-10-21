import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageChantier } from "./pages/page-chantier";

test.describe("Accès hors périmètre par URL", () => {
  test("un coordinateur départemental n'ouvre pas un chantier sur un département qui n'est pas le sien", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "coordinateur.departement@example.com",
    );

    const reponse = await page.goto("/chantier/CH-129/DEPT-13");

    expect(reponse?.status()).toBe(404);
    await new PageChantier(page, e2eContext).expectPageNotFound();
  });

  test("un coordinateur départemental est redirigé depuis l'accueil d'un département qui n'est pas le sien", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "coordinateur.departement@example.com",
    );

    await page.goto("/accueil/chantier/DEPT-13");

    await expect(page).not.toHaveURL(/DEPT-13/);
    await expect(page).toHaveURL(/\/accueil\/chantier\/DEPT-(56|29|35|22)/);
  });

  test("un profil sans gestion des comptes n'ouvre pas les pages de gestion des comptes", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "prefet.departement@example.com",
    );

    for (const chemin of ["/admin/utilisateurs", "/admin/utilisateur/creer"]) {
      const reponse = await page.request.get(chemin, { maxRedirects: 0 });

      expect(reponse.status(), chemin).toBe(307);
      expect(reponse.headers().location, chemin).toBe("/");
    }
  });
});
