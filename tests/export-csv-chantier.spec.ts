import { Download, expect, test } from '@playwright/test';
import fs from 'node:fs';
import { loginFn } from './utils';

test('doit pouvoir exporter les données des chantiers sous format CSV', async ({ page }) => {
  await loginFn({ page });
  test.setTimeout(150_000);

  await test.step("Ouverture de la modale d'export csv à l'étape 1 - Éléments à exporter", async () => {
    await page.getByRole('button', { name: /Exporter les données/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=1&typeExport=chantiers');
    await expect(page.getByRole('heading', { name: /Éléments à exporter/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 1 sur 5/ })).toBeVisible();
  });

  await test.step("Choix de l'export chantier", async () => {
    await page.getByLabel(/les chantiers/).check();
    await expect(page.getByLabel(/les chantiers/)).toBeChecked();
  });

  await test.step("Passage à l'étape 2 - Périmètre de l'export", async () => {
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=2&typeExport=chantiers');
    await expect(page.getByRole('heading', { name: /Périmètre de l'export/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 2 sur 5/ })).toBeVisible();
  });

  await test.step("Choix de l'export chantier sans filtres", async () => {
    await page.getByLabel(/exporter tous les éléments/).check();
    await expect(page.getByLabel(/exporter tous les éléments/)).toBeChecked();
  });

  await test.step("Passage à l'étape 3 - Données à collecter", async () => {
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers');
    await expect(page.getByRole('heading', { name: /Données à collecter/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 3 sur 5/ })).toBeVisible();
  });

  await test.step("Vérification des possibilités de choix d'export - identifiants", async () => {
    await expect(page.getByLabel(/identifiants du chantier et du territoire/)).toBeVisible();
    await expect(page.getByLabel(/identifiants du chantier et du territoire/)).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - gouvernance du chantier", async () => {
    await expect(page.getByLabel(/gouvernance du chantier/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'gouvernance du chantier' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance');
    await expect(page.getByLabel('gouvernance du chantier')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - responsabilité du chantier", async () => {
    await expect(page.getByLabel(/responsabilité du chantier/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'responsabilité du chantier' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite');
    await expect(page.getByLabel('responsabilité du chantier')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - objectifs du chantier", async () => {
    await expect(page.getByLabel(/objectifs du chantier/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'objectifs du chantier' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif');
    await expect(page.getByLabel('objectifs du chantier')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données descriptives du chantier sur le territoire", async () => {
    await expect(page.getByLabel(/données descriptives du chantier sur le territoire/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'données descriptives du chantier sur le territoire' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description');
    await expect(page.getByLabel('données descriptives du chantier sur le territoire')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - données de comparaison du chantier", async () => {
    await expect(page.getByLabel(/données de comparaison du chantier/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'données de comparaison du chantier' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison');
    await expect(page.getByLabel('données de comparaison du chantier')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - météo et synthèse des résultats du chantier sur le territoire", async () => {
    await expect(page.getByLabel(/météo et synthèse des résultats du chantier sur le territoire/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'météo et synthèse des résultats du chantier sur le territoire' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese');
    await expect(page.getByLabel('météo et synthèse des résultats du chantier sur le territoire')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - commentaires du chantier", async () => {
    await expect(page.getByLabel(/commentaires du chantier/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'commentaires du chantier' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire');
    await expect(page.getByLabel('commentaires du chantier')).toBeChecked();
  });

  await test.step("Vérification des possibilités de choix d'export - suivi des décisions stratégiques du chantier", async () => {
    await expect(page.getByLabel(/suivi des décisions stratégiques du chantier/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'suivi des décisions stratégiques du chantier' }).setChecked(true, { force: true });
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=3&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire,decision');
    await expect(page.getByLabel('suivi des décisions stratégiques du chantier')).toBeChecked();
  });

  await test.step("Passage à l'étape 4 - Récapitulatif et validation - partie vérification transmission paramètre", async () => {
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif,description,comparaison,synthese,commentaire,decision');
    await expect(page.getByRole('heading', { name: /Récapitulatif et validation/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exporter les données - Étape 4 sur 5/ })).toBeVisible();
  });
  let download: Download;

  await test.step("Retour à l'étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier", async () => {
    await test.step('Téléchargement du fichier', async () => {
      await page.goto('http://localhost:3000/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance');
      await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance');
      await expect(page.getByRole('heading', { name: /Récapitulatif et validation/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Exporter les données - Étape 4 sur 5/ })).toBeVisible();

      const downloadPromise = page.waitForEvent('download', {
        timeout: 120_000,
      });

      await page.getByTestId('form-export').getByRole('button', { name: /Exporter les données/ }).click();

      download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/PILOTE-Chantiers-.*\.csv/);
    });

    await test.step('vérification du fichier identifiant et gouvernance', async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch('"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier Id";"Chantier";"Ministère";"Axe";"Statut";"Chantier territorialisé";"Chantier du baromètre"\n');
    });
  });

  await test.step("Étape 4 - Récapitulatif et validation - partie téléchargement et vérification du fichier avec d'autres colonnes", async () => {
    await test.step('Téléchargement du fichier', async () => {
      await page.goto('http://localhost:3000/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif');

      await page.waitForURL('**/accueil/chantier/NAT-FR?isModaleExportCsvOuverte=true&etapeCourante=4&typeExport=chantiers&optionsExport=identifiant,gouvernance,responsabilite,objectif');

      const downloadPromise = page.waitForEvent('download', {
        timeout: 120_000,
      });

      await page.getByTestId('form-export').getByRole('button', { name: /Exporter les données/ }).click();

      download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/PILOTE-Chantiers-.*\.csv/);
    });

    await test.step('vérification du fichier identifiant, gouvernance, responsabilite et objectif', async () => {
      const contents = await fs.promises.readFile(await download.path());
      expect(contents.toString()).toMatch('"Maille";"Région";"Département";"Code INSEE - Nom du département";"Chantier Id";"Chantier";"Ministère";"Axe";"Statut";"Chantier territorialisé";"Chantier du baromètre";"Directeur projet";"Contact directeur projet";"Responsable local";"Contact responsable local";"Coordinateur territorial";"Contact coordinateur territorial";"Notre ambition";"Ce qui a déjà été fait";"Ce qui reste à faire"\n');
    });
  });
});
