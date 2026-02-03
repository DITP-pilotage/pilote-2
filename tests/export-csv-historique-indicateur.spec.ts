import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { seedDatabase } from "./utils";
import { AppActions } from "./actions/app.actions";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir exporter les données des indicateurs sous format CSV", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const appActions = new AppActions(page);
  const pageAccueil = await appActions.loginAs();

  await test.step("Selection d'un perimètre pour réduire la quantité de chantier exporté", async () => {
    await pageAccueil.filterByMinistere("Intérieur et Outre-mer");
  });

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Éléments à exporter", async () => {
    await pageAccueil.openExportModal();
    await pageAccueil.exportModal.expectStep(1, /Éléments à exporter/);
  });

  await test.step("Choix de l'export indicateurs", async () => {
    await pageAccueil.exportModal.selectExportType("historique-indicateurs");
    await expect(page.getByLabel(/l'historique des indicateurs/)).toBeChecked();
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await pageAccueil.exportModal.nextStep();
    await pageAccueil.exportModal.selectPerimeter(true);
    await pageAccueil.exportModal.expectStep(2, /Périmètre de l'export/);
  });

  await test.step("Passage à l'étape 3 - Données à collecter - choix données avec filtres", async () => {
    await pageAccueil.exportModal.nextStep();
    await pageAccueil.exportModal.expectStep(3, /Données à collecter/);
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
      await pageAccueil.exportModal.nextStep();
      await pageAccueil.exportModal.expectStep(
        4,
        /Récapitulatif et validation/,
      );

      download = await pageAccueil.exportModal.download();

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
