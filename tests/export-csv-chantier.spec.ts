import { Download, expect, test } from '@playwright/test';
import fs from 'node:fs';
import { loginFn } from './utils';

test('doit pouvoir exporter les données des chantiers sous format CSV', async ({ page }) => {
  await loginFn({ page });
  test.setTimeout(150_000);

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Contenus à exporter", async () => {
    await page.getByRole('button', { name: /Exporter les données V2/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=ppg');
    await expect(page.getByRole('heading', { name: /Contenus à exporter/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 1 sur 4/ })).toBeVisible();
  });

  await test.step("Choix de l'export chantier", async () => {
    await page.getByLabel(/Les PPG/).check();
    await expect(page.getByLabel('Les PPG')).toBeChecked();
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=2&typeExport=ppg');
    await expect(page.getByRole('heading', { name: /Périmètre de l'export/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 2 sur 4/ })).toBeVisible();
  });

  await test.step("Choix de l'export chantier sans filtres", async () => {
    await page.getByLabel(/exporter tous les contenus/).check();
    await expect(page.getByLabel('exporter tous les contenus')).toBeChecked();
  });

  await test.step("Passage à l'étape 3 - Données à collecter", async () => {
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg');
    await expect(page.getByRole('heading', { name: /Données à collecter/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 3 sur 4/ })).toBeVisible();
  });

  await test.step("Vérification des possibilités de choix d'export - identifiants", async () => {
    await expect(page.getByLabel(/identifiants de la PPG et du territoire/)).toBeVisible();
    await expect(page.getByLabel(/identifiants de la PPG et du territoire/)).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - gouvernance de la PPG", async () => {
    await expect(page.getByLabel(/gouvernance de la PPG/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'gouvernance de la PPG' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance');
    await expect(page.getByLabel('gouvernance de la PPG')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - responsabilité de la PPG", async () => {
    await expect(page.getByLabel(/responsabilité de la PPG/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'responsabilité de la PPG' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite');
    await expect(page.getByLabel('responsabilité de la PPG')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - objectifs de la PPG", async () => {
    await expect(page.getByLabel(/objectifs de la PPG/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'objectifs de la PPG' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif');
    await expect(page.getByLabel('objectifs de la PPG')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives de la PPG sur le territoire", async () => {
    await expect(page.getByLabel(/données descriptives de la PPG sur le territoire/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'données descriptives de la PPG sur le territoire' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif,description');
    await expect(page.getByLabel('données descriptives de la PPG sur le territoire')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données de comparaison de la PPG", async () => {
    await expect(page.getByLabel(/données de comparaison de la PPG/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'données de comparaison de la PPG' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison');
    await expect(page.getByLabel('données de comparaison de la PPG')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - météo et synthèse des résultats de la PPG sur le territoire", async () => {
    await expect(page.getByLabel(/météo et synthèse des résultats de la PPG sur le territoire/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'météo et synthèse des résultats de la PPG sur le territoire' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese');
    await expect(page.getByLabel('météo et synthèse des résultats de la PPG sur le territoire')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - commentaires de la PPG", async () => {
    await expect(page.getByLabel(/commentaires de la PPG/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'commentaires de la PPG' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire');
    await expect(page.getByLabel('commentaires de la PPG')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - suivi des décisions stratégiques de la PPG", async () => {
    await expect(page.getByLabel(/suivi des décisions stratégiques de la PPG/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'suivi des décisions stratégiques de la PPG' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire,decision');
    await expect(page.getByLabel('suivi des décisions stratégiques de la PPG')).toBeChecked();
  });

  await test.step("Passage à l'étape 4 - Récapitulatif et validation - partie vérification transmission paramètre", async () => {
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire,decision');
    await expect(page.getByRole('heading', { name: /Récapitulatif et validation/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 4 sur 4/ })).toBeVisible();
  });

  await test.step("Retour à l'étape 3 - Suppression des champs (Pour pouvoir tester le fichier après sinon trop de temps à DL)", async () => {
    await page.getByRole('button', { name: /Étape précédente/ }).click();
    await page.getByRole('checkbox', { name: 'responsabilité de la PPG' }).setChecked(false, { force: true });
    await page.getByRole('checkbox', { name: 'objectifs de la PPG' }).setChecked(false, { force: true });
    await page.getByRole('checkbox', { name: 'données descriptives de la PPG sur le territoire' }).setChecked(false, { force: true });
    await page.getByRole('checkbox', { name: 'données de comparaison de la PPG' }).setChecked(false, { force: true });
    await page.getByRole('checkbox', { name: 'météo et synthèse des résultats de la PPG sur le territoire' }).setChecked(false, { force: true });
    await page.getByRole('checkbox', { name: 'commentaires de la PPG' }).setChecked(false, { force: true });
    await page.getByRole('checkbox', { name: 'suivi des décisions stratégiques de la PPG' }).setChecked(false, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=ppg&optionsExport=identifiant,gouvernance');
  });

  let download: Download;

  await test.step("Retour à l'étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier", async () => {
    await test.step('Téléchargement du fichier', async () => {
      await page.getByRole('button', { name: /Étape suivante/ }).click();
      await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=ppg&optionsExport=identifiant,gouvernance');
      await expect(page.getByRole('heading', { name: /Récapitulatif et validation/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Exporter les données - Étape 4 sur 4/ })).toBeVisible();

      const downloadPromise = page.waitForEvent('download', {
        timeout: 120_000,
      });

      await page.getByTestId('form-export').getByRole('button', { name: /Exporter les données/ }).click();

      download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/PILOTE-Chantiers-.*\.csv/);
    });


    await test.step('vérification du fichier identifiant et gouvernance', async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch('"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier";"Chantier Id";"Ministère";"Axe";"Statut";"Chantier territorialisé";"Chantier du baromètre"\n');
    });
  });

  await test.step("Étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier avec d'autres colonnes", async () => {
    await test.step('Téléchargement du fichier', async () => {
      await page.goto('http://localhost:3000/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif');

      await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=ppg&optionsExport=identifiant,gouvernance,responsabilite,objectif');

      const downloadPromise = page.waitForEvent('download', {
        timeout: 120_000,
      });

      await page.getByTestId('form-export').getByRole('button', { name: /Exporter les données/ }).click();

      download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/PILOTE-Chantiers-.*\.csv/);
    });


    await test.step('vérification du fichier identifiant, gouvernance, responsabilite et objectif', async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch('"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier";"Chantier Id";"Ministère";"Axe";"Statut";"Chantier territorialisé";"Chantier du baromètre";"Directeur projet";"Contact directeur projet";"Responsable local";"Contact responsable local";"Notre ambition";"Ce qui a déjà été fait";"Ce qui reste à faire"\n');
    });
  });
});
