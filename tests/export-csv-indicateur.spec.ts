import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { AppActions } from "./actions/app.actions";

test("doit pouvoir exporter les données des indicateurs sous format CSV", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const appActions = new AppActions(page);
  const pageAccueil = await appActions.loginAs();

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Éléments à exporter", async () => {
    await pageAccueil.openExportModal();
    await pageAccueil.exportModal.expectStep(1, /Éléments à exporter/);
  });

  await test.step("Choix de l'export indicateurs", async () => {
    await pageAccueil.exportModal.selectExportType("indicateurs");
    await expect(
      page.getByLabel("les indicateurs des chantiers"),
    ).toBeChecked();
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await pageAccueil.exportModal.nextStep();
    await pageAccueil.exportModal.expectStep(2, /Périmètre de l'export/);
  });

  await test.step("Choix de l'export chantier sans filtres", async () => {
    await pageAccueil.exportModal.selectPerimeter(false);
    await expect(page.getByLabel("exporter tous les éléments")).toBeChecked();
  });

  await test.step("Passage à l'étape 3 - Données à collecter", async () => {
    await pageAccueil.exportModal.nextStep();
    await pageAccueil.exportModal.expectStep(3, /Données à collecter/);
  });

  await test.step("Vérification des possibilités de choix d'export - identifiants", async () => {
    await expect(
      page.getByLabel(
        /identifiants de l'indicateur, du chantier associé et du territoire/,
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel(
        /identifiants de l'indicateur, du chantier associé et du territoire/,
      ),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - cadrage de l'indicateur", async () => {
    await expect(page.getByLabel(/cadrage de l'indicateur/)).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(/cadrage de l'indicateur/);
    await expect(page.getByLabel(/cadrage de l'indicateur/)).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - gouvernance de l'indicateur et du chantier associé", async () => {
    await expect(
      page.getByLabel(/gouvernance de l'indicateur et du chantier associé/),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      /gouvernance de l'indicateur et du chantier associé/,
    );
    await expect(
      page.getByLabel(/gouvernance de l'indicateur et du chantier associé/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives de l'indicateur sur le territoire", async () => {
    await expect(
      page.getByLabel(/données de l'indicateur sur le territoire/),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      /données de l'indicateur sur le territoire/,
    );
    await expect(
      page.getByLabel(/données de l'indicateur sur le territoire/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives du chantier associé sur le territoire", async () => {
    await expect(
      page.getByLabel(/données du chantier associé sur le territoire/),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      /données du chantier associé sur le territoire/,
    );
    await expect(
      page.getByLabel(/données du chantier associé sur le territoire/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - météo et synthèse des résultats du chantier associé sur le territoire", async () => {
    await expect(
      page.getByLabel(
        /météo et synthèse des résultats du chantier associé sur le territoire/,
      ),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      /météo et synthèse des résultats du chantier associé sur le territoire/,
    );
    await expect(
      page.getByLabel(
        /météo et synthèse des résultats du chantier associé sur le territoire/,
      ),
    ).toBeChecked();
  });

  await test.step("Passage à l'étape 4 - Récapitulatif et validation - partie vérification transmission paramètre", async () => {
    await pageAccueil.exportModal.nextStep();
    await pageAccueil.exportModal.expectStep(4, /Récapitulatif et validation/);
  });

  let download: Download;

  await test.step("Retour à l'étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier", async () => {
    await test.step("Téléchargement du fichier", async () => {
      await page.goto(
        `/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,gouvernance`,
      );
      await pageAccueil.exportModal.expectStep(
        4,
        /Récapitulatif et validation/,
      );

      download = await pageAccueil.exportModal.download();

      expect(download.suggestedFilename()).toMatch(
        /PILOTE-Indicateurs-.*\.csv/,
      );
    });

    await test.step("vérification du fichier identifiant et cadrage", async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch(
        '"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier";"Chantier Id";"Indicateur";"Ministère";"Axe";"Chantier statut";"Chantier du baromètre"\n',
      );
    });
  });

  await test.step("Étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier avec d'autres colonnes", async () => {
    await test.step("Téléchargement du fichier", async () => {
      await page.goto(
        `/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,gouvernance,description`,
      );

      download = await pageAccueil.exportModal.download();

      expect(download.suggestedFilename()).toMatch(
        /PILOTE-Indicateurs-.*\.csv/,
      );
    });

    await test.step("vérification du fichier identifiant, gouvernance, valeur descriptive", async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch(
        '"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier";"Chantier Id";"Indicateur";"Ministère";"Axe";"Chantier statut";"Chantier du baromètre";"Valeur initiale";"Date valeur initiale";"Valeur avancement";"Date valeur avancement";"Valeur cible à fin d\'échéance 2025";"Date valeur cible à fin d\'échéance 2025";"Valeur cible à fin d\'échéance 2026";"Date valeur cible à fin d\'échéance 2026 (indicateur)";"Taux d\'avancement à fin d\'échéance 2025 (indicateur)";"Taux d\'avancement à fin d\'échéance 2026 (indicateur)"\n',
      );
    });
  });
});
