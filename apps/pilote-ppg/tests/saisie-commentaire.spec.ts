import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageChantier } from "./pages/page-chantier";
import { CHANTIER_SAISIE } from "./seed/entites-dediees";

test.describe("Saisie des publications d'un chantier", () => {
  test("un directeur de projet publie un commentaire national retrouvé dans l'historique", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "equipe.dir.projet@example.com",
    );
    await page.goto(`/chantier/${CHANTIER_SAISIE}/NAT-FR`);

    await new PageChantier(page, e2eContext).expectHistoriqueCommentaire(
      "risquesEtFreinsÀLever",
    );
  });

  test("un brouillon territorial n'est visible que de son auteur", async ({
    page,
    e2eContext,
  }) => {
    const contenu = `Brouillon territorial e2e ${randomUUID()}`;
    e2eContext.track("COMMENTAIRE_CREE", { contenu: { contains: contenu } });
    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("saisie.coordinateur.dept@example.com");
    await page.goto(`/chantier/${CHANTIER_SAISIE}/DEPT-56`);

    await page
      .getByLabel("bouton-nouveau-commentaire-commentairesSurLesDonnées")
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox").fill(contenu);
    await dialog
      .getByRole("button", { name: "Enregistrer en tant que brouillon" })
      .click();

    await expect(
      page.getByText(
        /Vous avez enregistré un nouveau commentaire en tant que brouillon/,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Editer un brouillon" }),
    ).toBeVisible();

    await appActions.switchUser("saisie.prefet.dept@example.com");
    await page.goto(`/chantier/${CHANTIER_SAISIE}/DEPT-56`);
    await expect(
      page.getByLabel("bouton-nouveau-commentaire-commentairesSurLesDonnées"),
    ).toBeVisible();
    await expect(
      page.getByText(
        /Vous avez enregistré un nouveau commentaire en tant que brouillon/,
      ),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Editer un brouillon" }),
    ).toHaveCount(0);
    await expect(page.getByText(contenu)).toHaveCount(0);
  });

  test("la météo publiée s'affiche sur la page du chantier et sur l'accueil", async ({
    page,
    e2eContext,
  }) => {
    const contenu = `Synthèse e2e ${randomUUID()}`;
    e2eContext.track("SYNTHESE_CREEE", { chantier_id: CHANTIER_SAISIE });
    await new AppActions(page, e2eContext).loginAs(
      "equipe.dir.projet@example.com",
    );
    await page.goto(`/chantier/${CHANTIER_SAISIE}/NAT-FR`);

    const sectionSynthese = page.locator("#synthèse");
    await sectionSynthese
      .getByRole("button", { name: "Nouveau commentaire" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Objectifs sécurisés" }).click();
    await dialog.getByRole("textbox").fill(contenu);
    await dialog.getByRole("button", { name: "Publier", exact: true }).click();

    await expect(sectionSynthese.getByText(contenu)).toBeVisible();
    const synthese = await prisma.synthese_des_resultats.findFirstOrThrow({
      where: { chantier_id: CHANTIER_SAISIE, territoire_code: "NAT-FR" },
      select: { meteo: true },
    });
    expect(synthese.meteo).toBe("SOLEIL");

    await page.goto("/accueil/chantier/NAT-FR");
    const ligneChantier = page
      .getByRole("row")
      .filter({ hasText: "Chantier e2e saisie" });
    const celluleMeteo = ligneChantier.getByRole("cell").nth(1);
    await expect(celluleMeteo.locator("svg, img")).toBeVisible();
    await expect(celluleMeteo).not.toHaveText("Non renseignée");
  });
});
