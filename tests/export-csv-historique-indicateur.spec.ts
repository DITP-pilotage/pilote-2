import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { loginFn, seedDatabase } from "./utils";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir exporter les données des indicateurs sous format CSV", async ({
  page,
}) => {
  await loginFn({ page });
  test.setTimeout(60_000);

  await test.step("Selection d'un perimètre pour réduire la quantité de chantier exporté", async () => {
    await page.getByRole("button", { name: /Filtrer par ministères/ }).click();
    await page
      .getByRole("button", { name: /Agriculture et Souveraineté alimentaire/ })
      .click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001",
    );
  });

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Éléments à exporter", async () => {
    await page.getByRole("button", { name: /Exporter les données/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001&isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=chantiers",
    );
    await expect(
      page.getByRole("heading", { name: /Éléments à exporter/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Exporter les données - Étape 1 sur 5/,
      }),
    ).toBeVisible();
  });

  await test.step("Choix de l'export indicateurs", async () => {
    await page
      .getByLabel(/l'historique des indicateurs/)
      .check({ force: true });
    await expect(page.getByLabel(/l'historique des indicateurs/)).toBeChecked();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001&isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=historique-indicateurs&optionsExport=identifiant,valeur-cible,valeur-avancement",
    );
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await page.getByRole("button", { name: /Étape suivante/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001&isModaleExportCsvOuverte=true&etapeCourante=2&typeExport=historique-indicateurs&optionsExport=identifiant,valeur-cible,valeur-avancement",
    );
    await page
      .getByLabel(
        /exporter les éléments de la sélection présentement active dans PILOTE/,
      )
      .check({ force: true });
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001&isModaleExportCsvOuverte=true&etapeCourante=2&typeExport=historique-indicateurs&optionsExport=identifiant,valeur-cible,valeur-avancement&isAvecFiltre=true",
    );
    await expect(
      page.getByRole("heading", { name: /Périmètre de l'export/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Exporter les données - Étape 2 sur 5/,
      }),
    ).toBeVisible();
  });

  await test.step("Passage à l'étape 3 - Données à collecter - choix données avec filtres", async () => {
    await page.getByRole("button", { name: /Étape suivante/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001&isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=historique-indicateurs&optionsExport=identifiant,valeur-cible,valeur-avancement&isAvecFiltre=true",
    );
    await expect(
      page.getByRole("heading", { name: /Données à collecter/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Exporter les données - Étape 3 sur 5/,
      }),
    ).toBeVisible();
  });

  await test.step("Vérification des possibilités de choix d'export - identifiants", async () => {
    await expect(
      page.getByLabel(/identifiants de l'indicateur et du territoire/),
    ).toBeVisible();
    await expect(
      page.getByLabel(/identifiants de l'indicateur et du territoire/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - valeur initiale et valeur cible", async () => {
    await expect(
      page.getByLabel(
        /valeur initiale et valeurs cibles\* de l'indicateur sur le territoire/,
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel(
        /valeur initiale et valeurs cibles\* de l'indicateur sur le territoire/,
      ),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - valeur avancement", async () => {
    await expect(
      page.getByLabel(
        /valeurs d'avancement de l'indicateur sur le territoire, mois par mois/,
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel(
        /valeurs d'avancement de l'indicateur sur le territoire, mois par mois/,
      ),
    ).toBeChecked();
  });

  let download: Download;

  await test.step("Retour à l'étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier", async () => {
    await test.step("Téléchargement du fichier", async () => {
      await page.getByRole("button", { name: /Étape suivante/ }).click();
      await page.waitForURL(
        "**/accueil/chantier/NAT-FR?pageIndex=1&perimetres=PER-001&isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=historique-indicateurs&optionsExport=identifiant,valeur-cible,valeur-avancement&isAvecFiltre=true",
      );
      await expect(
        page.getByRole("heading", { name: /Récapitulatif et validation/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: /Exporter les données - Étape 4 sur 5/,
        }),
      ).toBeVisible();

      const downloadPromise = page.waitForEvent("download", {
        timeout: 120_000,
      });

      await page
        .getByTestId("form-export")
        .getByRole("button", { name: /Exporter les données/ })
        .click();

      download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(
        /PILOTE-Historique-Indicateurs-.*\.csv/,
      );
    });

    await test.step("vérification du fichier identifiant et cadrage", async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch(
        '"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier";"Chantier Id";"Indicateur";"Valeur initiale";"Date valeur initiale";"Valeur cible année 2025";"Date valeur cible année 2025";"Valeur cible année 2026";"Date valeur cible année 2026";"Valeur avancement";"Date valeur avancement"\n',
      );
    });
  });
});
