import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { seedDatabase } from "./utils";
import { AppActions } from "./actions/app.actions";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir exporter les données des chantiers sous format CSV", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const appActions = new AppActions(page);
  const pageAccueil = await appActions.loginAs();

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Éléments à exporter", async () => {
    await pageAccueil.openExportModal();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=chantiers",
    );
    await pageAccueil.exportModal.expectStep(1, /Éléments à exporter/);
  });

  await test.step("Choix de l'export chantier", async () => {
    await pageAccueil.exportModal.selectExportType("chantiers");
    await expect(page.getByLabel(/les chantiers/)).toBeChecked();
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await pageAccueil.exportModal.nextStep();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=2&typeExport=chantiers",
    );
    await pageAccueil.exportModal.expectStep(2, /Périmètre de l'export/);
  });

  await test.step("Choix de l'export chantier sans filtres", async () => {
    await pageAccueil.exportModal.selectPerimeter(false);
    await expect(page.getByLabel(/exporter tous les éléments/)).toBeChecked();
  });

  await test.step("Passage à l'étape 3 - Données à collecter", async () => {
    await pageAccueil.exportModal.nextStep();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers",
    );
    await pageAccueil.exportModal.expectStep(3, /Données à collecter/);
  });

  await test.step("Vérification des possibilités de choix d'export - identifiants", async () => {
    await expect(
      page.getByLabel(/identifiants du chantier et du territoire/),
    ).toBeVisible();
    await expect(
      page.getByLabel(/identifiants du chantier et du territoire/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - gouvernance du chantier", async () => {
    await expect(page.getByLabel(/gouvernance du chantier/)).toBeVisible();
    await pageAccueil.exportModal.checkDataOption("gouvernance du chantier");
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance",
    );
    await expect(page.getByLabel("gouvernance du chantier")).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - responsabilité du chantier", async () => {
    await expect(page.getByLabel(/responsabilité du chantier/)).toBeVisible();
    await pageAccueil.exportModal.checkDataOption("responsabilité du chantier");
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite",
    );
    await expect(page.getByLabel("responsabilité du chantier")).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - objectifs du chantier", async () => {
    await expect(page.getByLabel(/objectifs du chantier/)).toBeVisible();
    await pageAccueil.exportModal.checkDataOption("objectifs du chantier");
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif",
    );
    await expect(page.getByLabel("objectifs du chantier")).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives du chantier sur le territoire", async () => {
    await expect(
      page.getByLabel(/données descriptives du chantier sur le territoire/),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      "données descriptives du chantier sur le territoire",
    );
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description",
    );
    await expect(
      page.getByLabel("données descriptives du chantier sur le territoire"),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données de comparaison du chantier", async () => {
    await expect(
      page.getByLabel(/données de comparaison du chantier/),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      "données de comparaison du chantier",
    );
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison",
    );
    await expect(
      page.getByLabel("données de comparaison du chantier"),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - météo et synthèse des résultats du chantier sur le territoire", async () => {
    await expect(
      page.getByLabel(
        /météo et synthèse des résultats du chantier sur le territoire/,
      ),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      "météo et synthèse des résultats du chantier sur le territoire",
    );
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese",
    );
    await expect(
      page.getByLabel(
        "météo et synthèse des résultats du chantier sur le territoire",
      ),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - commentaires du chantier", async () => {
    await expect(page.getByLabel(/commentaires du chantier/)).toBeVisible();
    await pageAccueil.exportModal.checkDataOption("commentaires du chantier");
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire",
    );
    await expect(page.getByLabel("commentaires du chantier")).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - suivi des décisions stratégiques du chantier", async () => {
    await expect(
      page.getByLabel(/suivi des décisions stratégiques du chantier/),
    ).toBeVisible();
    await pageAccueil.exportModal.checkDataOption(
      "suivi des décisions stratégiques du chantier",
    );
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire,decision",
    );
    await expect(
      page.getByLabel("suivi des décisions stratégiques du chantier"),
    ).toBeChecked();
  });

  await test.step("Passage à l'étape 4 - Récapitulatif et validation - partie vérification transmission paramètre", async () => {
    await pageAccueil.exportModal.nextStep();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire,decision",
    );
    await pageAccueil.exportModal.expectStep(4, /Récapitulatif et validation/);
  });

  let download: Download;

  await test.step("Retour à l'étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier", async () => {
    await test.step("Téléchargement du fichier", async () => {
      await page.goto(
        `/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance`,
      );
      await page.waitForURL(
        "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance",
      );
      await pageAccueil.exportModal.expectStep(
        4,
        /Récapitulatif et validation/,
      );

      download = await pageAccueil.exportModal.download();

      expect(download.suggestedFilename()).toMatch(/PILOTE-Chantiers-.*\.csv/);
    });

    await test.step("vérification du fichier identifiant et gouvernance", async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch(
        '"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier Id";"Chantier";"Ministère";"Axe";"Statut";"Chantier territorialisé";"Chantier du baromètre"\n',
      );
    });
  });

  await test.step("Étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier avec d'autres colonnes", async () => {
    await test.step("Téléchargement du fichier", async () => {
      await page.goto(
        `/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif`,
      );

      await page.waitForURL(
        "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif",
      );

      download = await pageAccueil.exportModal.download();

      expect(download.suggestedFilename()).toMatch(/PILOTE-Chantiers-.*\.csv/);
    });

    await test.step("vérification du fichier identifiant, gouvernance, responsabilite et objectif", async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch(
        '"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier Id";"Chantier";"Ministère";"Axe";"Statut";"Chantier territorialisé";"Chantier du baromètre";"Directeur projet";"Contact directeur projet";"Responsable local";"Contact responsable local";"Coordinateur territorial";"Contact coordinateur territorial";"Notre ambition";"Ce qui a déjà été fait";"Ce qui reste à faire"\n',
      );
    });
  });
});
