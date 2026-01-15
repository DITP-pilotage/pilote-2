import { expect, test } from "@playwright/test";

import { stringify } from "csv-stringify/sync";
import { loginFn, seedDatabase } from "./utils";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir importer des données", async ({ page }) => {
  await loginFn({ page });

  const informationChantierEtIndicateurPourTestsE2E = {
    id: "129",
    nom: "Moderniser la gestion des ressources",
    indicateurId: "IND-021",
    indicateurNom: "Nombre de conformité aux standards",
  };

  await test.step(`Navigation vers la page chantier "${informationChantierEtIndicateurPourTestsE2E.nom}"`, async () => {
    await expect(
      page.getByRole("table").getByRole("cell", {
        name: informationChantierEtIndicateurPourTestsE2E.nom,
      }),
    ).toBeVisible();
    await page
      .getByRole("table")
      .getByRole("cell", {
        name: informationChantierEtIndicateurPourTestsE2E.nom,
      })
      .click();
    await page.waitForURL(
      `**/chantier/CH-${informationChantierEtIndicateurPourTestsE2E.id}/NAT-FR**`,
    );
  });

  await test.step('Navigation vers la page "Mise à jour des données"', async () => {
    await expect(
      page.getByRole("link", { name: /Mettre à jour les données/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Mettre à jour les données/ }).click();
    await page.waitForURL(
      `**/chantier/CH-${informationChantierEtIndicateurPourTestsE2E.id}/indicateurs`,
    );
  });

  await test.step(`Sélection de l'indicateur ${informationChantierEtIndicateurPourTestsE2E.indicateurId} - ${informationChantierEtIndicateurPourTestsE2E.nom}`, async () => {
    await expect(page).toHaveTitle(
      `Mettre à jour les données - Chantier ${informationChantierEtIndicateurPourTestsE2E.id} - PILOTE`,
    );
    await expect(
      page.getByRole("heading", { name: /Sélectionnez l'indicateur/ }),
    ).toBeVisible();

    await page.getByLabel("Choix de l'indicateur").selectOption({
      label: `${informationChantierEtIndicateurPourTestsE2E.indicateurId} : ${informationChantierEtIndicateurPourTestsE2E.indicateurNom}`,
    });
  });

  await test.step("Passage à l'étape suivante 'Charger le fichier'", async () => {
    await page.getByRole("button", { name: /Suivant/ }).click();
    await page.waitForURL(
      `**/chantier/CH-${informationChantierEtIndicateurPourTestsE2E.id}/indicateurs?etapeCourante=2**`,
    );
    await expect(
      page.getByRole("heading", { name: /Étape 2 sur 3/ }),
    ).toBeVisible();
  });

  await test.step("Choix d'un fichier contenant des erreurs", async () => {
    const stringifier = stringify(
      [
        ["IND-97", "D12", "Aveyron", "2023-03-31", "va", "5"],
        [
          `${informationChantierEtIndicateurPourTestsE2E.indicateurId}`,
          "D13",
          "Bouches-du-Rhône",
          "2023-01-17",
          "va",
          "12",
        ],
        [
          `${informationChantierEtIndicateurPourTestsE2E.indicateurId}`,
          "D14",
          "Calvados",
          "2023-02-26",
          "va",
          "20",
        ],
      ],
      {
        header: true,
        columns: [
          "identifiant_indic",
          "zone_id",
          "zone_nom",
          "date_valeur",
          "type_valeur",
          "valeur",
        ],
      },
    );

    await page.getByLabel("Choisir un fichier").setInputFiles({
      name: `${informationChantierEtIndicateurPourTestsE2E.indicateurId}.csv`,
      mimeType: "text/csv",
      buffer: Buffer.from(stringifier),
    });
  });

  await test.step("Action de vérification du fichier", async () => {
    await page.getByRole("button", { name: /Vérifier le fichier/ }).click();
  });

  await test.step("Vérification que le fichier n'est pas conforme", async () => {
    await expect(
      page.getByText(/Bravo, le fichier est conforme !/),
    ).not.toBeVisible();
    await expect(
      page.getByText(/Le fichier ne peut pas être importé/),
    ).toBeVisible();
    await expect(
      page.getByText(/IND-97 ne respecte pas le motif imposé/),
    ).toBeVisible();
    await expect(
      page.getByText(
        `L'indicateur IND-97 ne correpond pas à l'indicateur choisis (${informationChantierEtIndicateurPourTestsE2E.indicateurId})`,
      ),
    ).toBeVisible({
      timeout: 30_000,
    });
  });

  await test.step("Choix d'un fichier valide", async () => {
    const stringifier = stringify(
      [
        [
          `${informationChantierEtIndicateurPourTestsE2E.indicateurId}`,
          "D12",
          "Aveyron",
          "2023-03-31",
          "va",
          "5",
        ],
        [
          `${informationChantierEtIndicateurPourTestsE2E.indicateurId}`,
          "D13",
          "Bouches-du-Rhône",
          "2023-01-17",
          "va",
          "12",
        ],
        [
          `${informationChantierEtIndicateurPourTestsE2E.indicateurId}`,
          "D14",
          "Calvados",
          "2023-02-26",
          "va",
          "20",
        ],
      ],
      {
        header: true,
        columns: [
          "identifiant_indic",
          "zone_id",
          "zone_nom",
          "date_valeur",
          "type_valeur",
          "valeur",
        ],
      },
    );

    await page.getByLabel("Choisir un fichier").setInputFiles({
      name: `${informationChantierEtIndicateurPourTestsE2E.indicateurId}.csv`,
      mimeType: "text/csv",
      buffer: Buffer.from(stringifier),
    });
  });

  await test.step("Action de vérification du fichier", async () => {
    await page.getByRole("button", { name: /Vérifier le fichier/ }).click();
  });

  await test.step("Vérification que le fichier est conforme", async () => {
    await expect(
      page.getByText(/Bravo, le fichier est conforme !/),
    ).toBeVisible();
  });

  await test.step('Passage à l\'étape suivante "Transmettre les données pour publication"', async () => {
    await page.getByRole("button", { name: /Suivant/ }).click();
    await page.waitForURL(
      `**/chantier/CH-${informationChantierEtIndicateurPourTestsE2E.id}/indicateurs?etapeCourante=3**`,
    );
    await expect(
      page.getByRole("heading", { name: /Étape 3 sur 3/ }),
    ).toBeVisible();
  });

  await test.step("Action de transmissions des données vérifiés", async () => {
    await page
      .getByRole("button", { name: /Transmettre les données/ })
      .first()
      .click();
  });

  await test.step("Vérification que les données ont correctement été transmises", async () => {
    await expect(
      page.getByText(
        `Les données ont été importées avec succès pour l'indicateur ${informationChantierEtIndicateurPourTestsE2E.indicateurId}`,
      ),
    ).toBeVisible();
  });
});
