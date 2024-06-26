import { expect, test } from '@playwright/test';

import { stringify } from 'csv-stringify/sync';
import { loginFn } from './utils';

test('doit pouvoir importer des données', async ({ page }) => {
  await loginFn({ page });

  await test.step('Navigation vers la page chantier "Doubler les effectifs de la réserve opérationnelle"', async () => {
    await page.getByRole('table').getByRole('cell', { name: /Doubler les effectifs de la réserve opérationnelle/ }).click();
  });

  await test.step('Navigation vers la page "Mise à jour des données"', async () => {
    await expect(page.getByRole('link', { name: /Mettre à jour les données/ })).toBeVisible();
    await page.getByRole('link', { name: /Mettre à jour les données/ }).click();
  });

  await test.step('Sélection de l\'indicateur IND-927 - Part d’entraînement de la réserve opérationnelle', async () => {
    await expect(page).toHaveTitle(/Mettre à jour les données - Chantier 027 - PILOTE/);
    await expect(page.getByRole('heading', { name: /Sélectionnez l’indicateur/ })).toBeVisible();
    await page.getByLabel('Choix de l\'indicateur').selectOption({ label: 'Part d’entraînement de la réserve opérationnelle' });
  });

  await test.step('Passage à l\'étape suivante "Charger le fichier"', async () => {
    await page.getByRole('button', { name: /Suivant/ }).click();
    await expect(page.getByRole('heading', { name: /Étape 2 sur 3/ })).toBeVisible();
  });

  await test.step('Choix d\'un fichier', async () => {
    const stringifier = stringify(
      [
        ['IND-927', 'D12', 'Aveyron', '2023-03-31', 'va', '5'],
        ['IND-927', 'D13', 'Bouches-du-Rhône', '2023-01-17', 'va', '12'],
        ['IND-927', 'D14', 'Calvados', '2023-02-26', 'va', '20'],
      ], {
        header: true,
        columns: ['identifiant_indic', 'zone_id', 'zone_nom', 'date_valeur', 'type_valeur', 'valeur'],
      });

    await page.getByLabel('Choisir un fichier').setInputFiles({
      name: 'IND-927.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        stringifier,
      ),
    });
  });

  await test.step('Action de vérification du fichier', async () => {
    await page.getByRole('button', { name: /Vérifier le fichier/ }).click();
  });

  await test.step('Vérification que le fichier est conforme', async () => {
    await expect(page.getByText(/Bravo, le fichier est conforme !/)).toBeVisible();
  });

  await test.step('Passage à l\'étape suivante "Transmettre les données pour publication"', async () => {
    await page.getByRole('button', { name: /Suivant/ }).click();
    await expect(page.getByRole('heading', { name: /Étape 3 sur 3/ })).toBeVisible();
  });

  await test.step('Action de transmissions des données vérifiés', async () => {
    await page.getByRole('button', { name: /Transmettre les données/ }).first().click();
  });

  await test.step('Vérification que les données ont correctement été transmises', async () => {
    await expect(page.getByText(/Les données ont été importées avec succès pour l’indicateur IND-927/)).toBeVisible();
  });
});
