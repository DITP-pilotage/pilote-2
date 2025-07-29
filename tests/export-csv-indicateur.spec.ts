import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { configuration } from "@/config";
import { loginFn } from "./utils";

test("doit pouvoir exporter les données des indicateurs sous format CSV", async ({
  page,
}) => {
  await loginFn({ page });
  test.setTimeout(60_000);

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Éléments à exporter", async () => {
    await page.getByRole("button", { name: /Exporter les données/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=chantiers",
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
      .getByLabel(/les indicateurs des chantiers/)
      .check({ force: true });
    await expect(
      page.getByLabel("les indicateurs des chantiers"),
    ).toBeChecked();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=indicateurs&optionsExport=identifiant",
    );
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await page.getByRole("button", { name: /Étape suivante/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=2&typeExport=indicateurs&optionsExport=identifiant",
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

  await test.step("Choix de l'export chantier sans filtres", async () => {
    await page.getByLabel(/exporter tous les éléments/).check();
    await expect(page.getByLabel("exporter tous les éléments")).toBeChecked();
  });

  await test.step("Passage à l'étape 3 - Données à collecter", async () => {
    await page.getByRole("button", { name: /Étape suivante/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=indicateurs&optionsExport=identifiant",
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
    await page
      .getByRole("checkbox", { name: /cadrage de l'indicateur/ })
      .setChecked(true, { force: true });
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=indicateurs&optionsExport=identifiant,cadrage",
    );
    await expect(page.getByLabel(/cadrage de l'indicateur/)).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - gouvernance de l'indicateur et du chantier associé", async () => {
    await expect(
      page.getByLabel(/gouvernance de l'indicateur et du chantier associé/),
    ).toBeVisible();
    await page
      .getByRole("checkbox", {
        name: /gouvernance de l'indicateur et du chantier associé/,
      })
      .setChecked(true, { force: true });
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=indicateurs&optionsExport=identifiant,cadrage,gouvernance",
    );
    await expect(
      page.getByLabel(/gouvernance de l'indicateur et du chantier associé/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives de l'indicateur sur le territoire", async () => {
    await expect(
      page.getByLabel(/données de l'indicateur sur le territoire/),
    ).toBeVisible();
    await page
      .getByRole("checkbox", {
        name: /données de l'indicateur sur le territoire/,
      })
      .setChecked(true, { force: true });
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=indicateurs&optionsExport=identifiant,cadrage,gouvernance,description",
    );
    await expect(
      page.getByLabel(/données de l'indicateur sur le territoire/),
    ).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives du chantier associé sur le territoire", async () => {
    await expect(
      page.getByLabel(/données du chantier associé sur le territoire/),
    ).toBeVisible();
    await page
      .getByRole("checkbox", {
        name: /données du chantier associé sur le territoire/,
      })
      .setChecked(true, { force: true });
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=indicateurs&optionsExport=identifiant,cadrage,gouvernance,description,description-chantier",
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
    await page
      .getByRole("checkbox", {
        name: /météo et synthèse des résultats du chantier associé sur le territoire/,
      })
      .setChecked(true, { force: true });
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=indicateurs&optionsExport=identifiant,cadrage,gouvernance,description,description-chantier,synthese",
    );
    await expect(
      page.getByLabel(
        /météo et synthèse des résultats du chantier associé sur le territoire/,
      ),
    ).toBeChecked();
  });

  await test.step("Passage à l'étape 4 - Récapitulatif et validation - partie vérification transmission paramètre", async () => {
    await page.getByRole("button", { name: /Étape suivante/ }).click();
    await page.waitForURL(
      "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,cadrage,gouvernance,description,description-chantier,synthese",
    );
    await expect(
      page.getByRole("heading", { name: /Récapitulatif et validation/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Exporter les données - Étape 4 sur 5/,
      }),
    ).toBeVisible();
  });

  let download: Download;

  await test.step("Retour à l'étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier", async () => {
    await test.step("Téléchargement du fichier", async () => {
      await page.goto(
        `${configuration.baseUrl}/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,gouvernance`,
      );
      await page.waitForURL(
        "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,gouvernance",
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
        `${configuration.baseUrl}/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,gouvernance,description`,
      );

      await page.waitForURL(
        "**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=indicateurs&optionsExport=identifiant,gouvernance,description",
      );

      const downloadPromise = page.waitForEvent("download", {
        timeout: 120_000,
      });

      await page
        .getByTestId("form-export")
        .getByRole("button", { name: /Exporter les données/ })
        .click();

      download = await downloadPromise;

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
