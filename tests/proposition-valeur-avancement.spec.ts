import { test, expect, Page } from "@playwright/test";
import { AppActions } from "./actions/app.actions";

const CHANTIER_ID = "129";
const CHANTIER_NOM = "Moderniser la gestion des ressources";
const TERRITOIRE_DEPT = "DEPT-56";
const TERRITOIRE_REG = "REG-53";

const COORDINATEUR_DEPT = "pva.coordinateur.dept@example.com";
const PREFET_DEPT = "pva.prefet.dept@example.com";
const COORDINATEUR_REG = "pva.coordinateur.reg@example.com";
const EQUIPE_DIR_PROJET = "pva.dir.projet@example.com";

function getIndicateurSection(page: Page, indicId: string) {
  return page.locator(
    `xpath=//strong[text()="${indicId}"]/ancestor::section[1]`,
  );
}

async function loginAs(page: Page, email: string) {
  await page.context().clearCookies();
  const appActions = new AppActions(page);
  await appActions.loginAs(email);
}

async function navigateToChantier(page: Page, territoireCode: string) {
  await page.goto(`/chantier/CH-${CHANTIER_ID}/${territoireCode}`);
  await expect(
    page.getByRole("heading", { name: /Avancement du chantier/ }),
  ).toBeVisible();

  const accordionButton = page.getByRole("button", {
    name: /Autres indicateurs/,
  });
  const isExpanded = await accordionButton.getAttribute("aria-expanded");
  if (isExpanded !== "true") {
    await accordionButton.click();
  }
}

test.describe("Proposition de valeur d'avancement (PVA)", () => {
  test("Coordinateur département propose, Direction accuse réception puis accepte", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const indicId = "IND-021";

    await test.step("Territoire crée une proposition", async () => {
      await loginAs(page, COORDINATEUR_DEPT);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        })
        .click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByText("Proposer une valeur d'avancement"),
      ).toBeVisible();

      await dialog.locator('input[name="valeurAvancement"]').fill("42.5");
      await dialog
        .locator('textarea[name="motifProposition"]')
        .fill("Motif test e2e proposition initiale");
      await dialog
        .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
        .fill("Source test e2e et methode de calcul");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(dialog.getByText("42.5")).toBeVisible();
      await expect(
        dialog.getByText("Motif test e2e proposition initiale"),
      ).toBeVisible();

      await dialog
        .getByRole("button", { name: /Publier la proposition/ })
        .click();

      await expect(
        dialog.getByText(/correctement été prise en compte/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification du statut côté territoire après création", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(
          /Proposition de nouvelle valeur d'avancement en cours/,
        ),
      ).toBeVisible();
      await expect(
        section.getByText(/en attente de lecture par la direction de projet/),
      ).toBeVisible();

      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await expect(
        section.getByRole("button", { name: /Modifier la proposition/ }),
      ).toBeVisible();
      await expect(
        section.getByRole("button", { name: /Supprimer la proposition/ }),
      ).toBeVisible();
    });

    await test.step("Direction accuse réception de la proposition", async () => {
      await loginAs(page, EQUIPE_DIR_PROJET);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(
          /Proposition de nouvelle valeur d'avancement en cours/,
        ),
      ).toBeVisible();

      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await section.getByRole("button", { name: /Accuser réception/ }).click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("heading", {
          name: "Accuser réception",
          exact: true,
        }),
      ).toBeVisible();

      await dialog
        .locator('textarea[name="motif"]')
        .fill("Information complementaire pour le territoire");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(
        dialog.getByText("Information complementaire pour le territoire"),
      ).toBeVisible();

      await dialog
        .getByRole("button", {
          name: /Confirmer l'envoi de l'accusé de réception/,
        })
        .click();

      await expect(dialog.getByText(/a bien été enregistré/)).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification côté territoire : boutons désactivés après accusé réception", async () => {
      await loginAs(page, COORDINATEUR_DEPT);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(/lue par la direction de projet/),
      ).toBeVisible();

      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await expect(
        section.getByRole("button", { name: /Modifier la proposition/ }),
      ).not.toBeVisible();
      await expect(
        section.getByRole("button", { name: /Supprimer la proposition/ }),
      ).not.toBeVisible();
    });

    await test.step("Direction accepte la proposition", async () => {
      await loginAs(page, EQUIPE_DIR_PROJET);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await section
        .getByRole("button", { name: /Prendre une décision/ })
        .click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("heading", {
          name: "Prendre une décision",
          exact: true,
        }),
      ).toBeVisible();

      await dialog.getByLabel(/accepter la proposition$/).check({ force: true });

      await dialog
        .locator('textarea[name="motif"]')
        .fill("Acceptation validee");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(
        dialog.getByText(/la proposition est acceptée/),
      ).toBeVisible();

      await dialog
        .getByRole("button", { name: /Accepter la proposition/ })
        .click();

      await expect(
        dialog.getByText(/a bien été acceptée/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification du statut accepté côté direction", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(/Proposition de nouvelle valeur d'avancement/),
      ).toBeVisible();
      await expect(section.getByText(/acceptée/)).toBeVisible();
    });

    await test.step("Vérification de l'historique des propositions", async () => {
      const section = getIndicateurSection(page, indicId);
      await section.getByRole("button", { name: /Voir l'historique/ }).click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByText("Historique des actions sur les valeurs d'avancement"),
      ).toBeVisible();
      await expect(dialog.getByText(indicId)).toBeVisible();

      await expect(dialog.getByText(/nouvelle proposition/)).toBeVisible();
      await expect(
        dialog.getByText(/accusé de réception de la proposition/),
      ).toBeVisible();
      await expect(
        dialog.getByText(/acceptée.*par la direction de projet/),
      ).toBeVisible();

      await page.getByTitle("Fermer la fenêtre modale").click();
    });
  });

  test("Préfet département propose, Direction refuse, Territoire peut re-proposer", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const indicId = "IND-022";

    await test.step("Territoire crée une proposition", async () => {
      await loginAs(page, PREFET_DEPT);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        })
        .click();

      const dialog = page.getByRole("dialog");
      await dialog.locator('input[name="valeurAvancement"]').fill("85");
      await dialog
        .locator('textarea[name="motifProposition"]')
        .fill("Motif test e2e par prefet departement");
      await dialog
        .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
        .fill("Source prefet departement");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();
      await dialog
        .getByRole("button", { name: /Publier la proposition/ })
        .click();

      await expect(
        dialog.getByText(/correctement été prise en compte/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Direction refuse la proposition", async () => {
      await loginAs(page, EQUIPE_DIR_PROJET);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await section
        .getByRole("button", { name: /Prendre une décision/ })
        .click();

      const dialog = page.getByRole("dialog");
      await dialog.getByLabel(/refuser la proposition/).check({ force: true });

      await dialog
        .locator('textarea[name="motif"]')
        .fill("Motif de refus test e2e");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(
        dialog.getByText(/la proposition est refusée/),
      ).toBeVisible();

      await dialog.getByRole("button", { name: /Valider la décision/ }).click();

      await expect(
        dialog.getByText(/a bien été refusée/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification côté direction : proposition refusée", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(/dernière proposition en date refusée/),
      ).toBeVisible();
    });

    await test.step("Vérification côté territoire : peut proposer à nouveau", async () => {
      await loginAs(page, PREFET_DEPT);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(/dernière proposition en date refusée/),
      ).toBeVisible();

      await expect(
        section.getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        }),
      ).toBeVisible();
    });

    await test.step("Vérification de l'historique", async () => {
      const section = getIndicateurSection(page, indicId);
      await section.getByRole("button", { name: /Voir l'historique/ }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText(/nouvelle proposition/)).toBeVisible();
      await expect(
        dialog.getByText(/refusée.*par la direction de projet/),
      ).toBeVisible();

      await page.getByTitle("Fermer la fenêtre modale").click();
    });
  });

  test("Territoire propose, Direction accepte avec modification de valeur", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const indicId = "IND-023";

    await test.step("Territoire crée une proposition avec valeur 75", async () => {
      await loginAs(page, COORDINATEUR_DEPT);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        })
        .click();

      const dialog = page.getByRole("dialog");
      await dialog.locator('input[name="valeurAvancement"]').fill("75");
      await dialog
        .locator('textarea[name="motifProposition"]')
        .fill("Motif proposition valeur 75");
      await dialog
        .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
        .fill("Source donnees test");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();
      await dialog
        .getByRole("button", { name: /Publier la proposition/ })
        .click();

      await expect(
        dialog.getByText(/correctement été prise en compte/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Direction accepte avec modification (valeur 60)", async () => {
      await loginAs(page, EQUIPE_DIR_PROJET);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await section
        .getByRole("button", { name: /Prendre une décision/ })
        .click();

      const dialog = page.getByRole("dialog");
      await dialog
        .getByLabel(/accepter la proposition avec modification/)
        .check({ force: true });

      await dialog.locator('input[name="valeurModification"]').fill("60");

      await dialog
        .locator('textarea[name="motif"]')
        .fill("Valeur ajustee a 60 selon nos donnees");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(
        dialog.getByText(/la proposition est modifiée/),
      ).toBeVisible();
      await expect(dialog.getByText("60 ()")).toBeVisible();

      await dialog
        .getByRole("button", { name: /Accepter avec modification/ })
        .click();

      await expect(
        dialog.getByText(/a bien été acceptée avec modification/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification du statut acceptée avec modification", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(/acceptée avec modification/),
      ).toBeVisible();
    });

    await test.step("Vérification de l'historique", async () => {
      const section = getIndicateurSection(page, indicId);
      await section.getByRole("button", { name: /Voir l'historique/ }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText(/nouvelle proposition/)).toBeVisible();
      await expect(
        dialog.getByText(/acceptée avec modification/),
      ).toBeVisible();

      await page.getByTitle("Fermer la fenêtre modale").click();
    });
  });

  test("Territoire modifie puis supprime sa proposition", async ({ page }) => {
    test.setTimeout(300_000);

    const indicId = "IND-024";

    await test.step("Territoire crée une proposition avec valeur 30", async () => {
      await loginAs(page, COORDINATEUR_DEPT);
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        })
        .click();

      const dialog = page.getByRole("dialog");
      await dialog.locator('input[name="valeurAvancement"]').fill("30");
      await dialog
        .locator('textarea[name="motifProposition"]')
        .fill("Motif proposition initiale a modifier");
      await dialog
        .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
        .fill("Source initiale");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();
      await dialog
        .getByRole("button", { name: /Publier la proposition/ })
        .click();

      await expect(
        dialog.getByText(/correctement été prise en compte/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Territoire modifie la proposition (valeur 35)", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(
          /Proposition de nouvelle valeur d'avancement en cours/,
        ),
      ).toBeVisible();

      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await section
        .getByRole("button", { name: /Modifier la proposition/ })
        .click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByText("Proposer une valeur d'avancement"),
      ).toBeVisible();

      await dialog.locator('input[name="valeurAvancement"]').fill("35");
      await dialog
        .locator('textarea[name="motifProposition"]')
        .fill("Motif modifie valeur corrigee a 35");
      await dialog
        .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
        .fill("Source corrigee");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(
        dialog.getByText(/Valeur d'avancement proposée/),
      ).toBeVisible();

      await dialog
        .getByRole("button", { name: /Publier la proposition/ })
        .click();

      await expect(
        dialog.getByText(/correctement été prise en compte/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification du statut modifié", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(
          /Proposition de nouvelle valeur d'avancement en cours/,
        ),
      ).toBeVisible();
      await expect(
        section.getByText(/modifiée par le territoire/),
      ).toBeVisible();
    });

    await test.step("Territoire supprime la proposition", async () => {
      const section = getIndicateurSection(page, indicId);
      await section
        .getByRole("button", { name: /Afficher la proposition/ })
        .click();

      await section
        .getByRole("button", { name: /Supprimer la proposition/ })
        .click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("heading", { name: "Supprimer la proposition", exact: true }),
      ).toBeVisible();

      await dialog
        .locator('textarea[name="motifSuppression"]')
        .fill("Suppression car proposition erronee");

      await dialog.getByRole("button", { name: /Étape suivante/ }).click();

      await expect(
        dialog.getByText("Suppression car proposition erronee"),
      ).toBeVisible();

      await dialog
        .getByRole("button", { name: /Supprimer la proposition/ })
        .click();

      await expect(
        dialog.getByText(/correctement été supprimée/),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByTitle("Fermer la fenêtre modale").click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    await test.step("Vérification : proposition supprimée et possibilité de re-proposer", async () => {
      await navigateToChantier(page, TERRITOIRE_DEPT);

      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(/dernière proposition en date supprimée/),
      ).toBeVisible();

      await expect(
        section.getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        }),
      ).toBeVisible();
    });

    await test.step("Vérification de l'historique complet", async () => {
      const section = getIndicateurSection(page, indicId);
      await section.getByRole("button", { name: /Voir l'historique/ }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText(/nouvelle proposition/)).toBeVisible();
      await expect(
        dialog.getByText(/modification de la proposition/),
      ).toBeVisible();
      await expect(
        dialog.getByText(/suppression de la proposition/),
      ).toBeVisible();

      await page.getByTitle("Fermer la fenêtre modale").click();
    });
  });

  test("Maille région agrégée - blocage de la proposition", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    // IND-021 a maille_reg_agregee=true, donc impossible de proposer au niveau REG
    const indicId = "IND-021";

    await test.step("Coordinateur région navigue vers le chantier au niveau régional", async () => {
      await loginAs(page, COORDINATEUR_REG);
      await navigateToChantier(page, TERRITOIRE_REG);
    });

    await test.step("Vérification du message de blocage sur indicateur agrégé", async () => {
      const section = getIndicateurSection(page, indicId);
      await expect(
        section.getByText(
          /Impossible de proposer une autre valeur d'avancement/,
        ),
      ).toBeVisible();

      await expect(
        section.getByRole("button", {
          name: /Proposer une autre valeur d'avancement/,
        }),
      ).not.toBeVisible();
    });
  });
});
