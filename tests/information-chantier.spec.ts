import { expect, test } from "@playwright/test";
import { loginFn, seedDatabase } from "./utils";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir consulter les données des chantiers", async ({ page }) => {
  test.setTimeout(90_000);
  await loginFn({ page });

  const informationChantierEtIndicateurTestsE2E = {
    id: "155",
    nom: "Faciliter l'efficacité opérationnelle",
  };

  await test.step("Vérification de la structure de la page d'accueil", async () => {
    await expect(
      page.getByRole("heading", { name: /\d+ chantiers/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Taux d'avancement moyen/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Taux d'avancement des chantiers par territoire/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Répartition des météos renseignées/ }),
    ).toBeVisible();
  });

  await test.step("Ajout du filtre ministère 'Transition écologique et Cohésion des territoires'", async () => {
    await page.getByRole("button", { name: /Filtrer par ministères/ }).click();
    await page
      .getByRole("button", {
        name: /Transition écologique et Cohésion des territoires/,
      })
      .click();
  });

  await test.step("Vérification filtre ministère actif 'Transition écologique et Cohésion des territoires'", async () => {
    await expect(
      page.locator("button[aria-label='Retirer le tag Logement']"),
    ).toBeVisible();
    await expect(
      page.locator("button[aria-label='Retirer le tag Transition Écologique']"),
    ).toBeVisible();
  });

  await test.step(`Navigation vers le chantier "${informationChantierEtIndicateurTestsE2E.nom}"`, async () => {
    await expect(
      page.getByRole("table").getByRole("cell", {
        name: `${informationChantierEtIndicateurTestsE2E.nom}`,
      }),
    ).toBeVisible();
    await page
      .getByRole("table")
      .getByRole("cell", {
        name: `${informationChantierEtIndicateurTestsE2E.nom}`,
      })
      .click();
    await page.waitForURL(
      `**/chantier/CH-${informationChantierEtIndicateurTestsE2E.id}/NAT-FR**`,
    );
  });

  await test.step(`Vérification de la structure de la page chantier "${informationChantierEtIndicateurTestsE2E.nom}"`, async () => {
    await expect(page).toHaveTitle(
      `Chantier ${informationChantierEtIndicateurTestsE2E.id} - ${informationChantierEtIndicateurTestsE2E.nom} - PILOTE`,
    );

    await expect(
      page.getByRole("heading", { name: /Avancement du chantier/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Responsables/ }),
    ).toBeVisible();
    await expect(page.getByText(/^Minimum$/)).toBeVisible();
    await expect(page.getByText(/^Médiane$/)).toBeVisible();
    await expect(page.getByText(/^Maximum$/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Météo et synthèse des résultats$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Répartition géographique$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Objectifs$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Notre ambition$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Ce qui a déjà été fait$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Ce qui reste à faire$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Indicateurs \(5\)$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /^Indicateurs pris en compte dans le taux d'avancement du territoire \(5\)$/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Décisions stratégiques$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Suivi des décisions stratégiques$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Commentaires du chantier$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /^Autres résultats obtenus \(non corrélés aux indicateurs\)$/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Risques et freins à lever$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Solutions et actions à venir$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Exemples concrets de réussite$/ }),
    ).toBeVisible();
  });
});
