import { expect, test } from '@playwright/test';

import { stringify } from 'csv-stringify/sync';
import { loginFn } from './utils';

test('doit pouvoir importer des données', async ({ page }) => {
  await loginFn({ page });

  await page.getByRole('table').getByRole('cell', { name:/Armées/ }).click();

  await page.getByRole('table').getByRole('cell', { name: 'Doubler les effectifs' }).click();

  await expect(page.getByRole('link', { name: /Mettre à jour les données/ })).toBeVisible();

  await page.getByRole('link', { name: /Mettre à jour les données/ }).click();

  await expect(page).toHaveTitle(/Mettre à jour les données - Chantier 027 - PILOTE/);

  await expect(page.getByRole('heading', { name: /Sélectionnez l’indicateur/ })).toBeVisible();

  await page.getByRole('button', { name: /Suivant/ }).click();

  await expect(page.getByRole('heading', { name: /Étape 2 sur 3/ })).toBeVisible();

  const stringifier = stringify(
    [
      ['IND-510', 'D12', 'Aveyron', '2023-03-31', 'va', '5'],
      ['IND-510', 'D13', 'Bouches-du-Rhône', '2023-01-17', 'va', '12'],
      ['IND-510', 'D14', 'Calvados', '2023-02-26', 'va', '20'],
    ], {
      header: true,
      columns: ['identifiant_indic', 'zone_id', 'zone_nom', 'date_valeur', 'type_valeur', 'valeur'],
    });

  await page.getByLabel('Choisir un fichier').setInputFiles({
    name: 'IND-510.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      stringifier,
    ),
  });

  await page.getByRole('button', { name: /Vérifier le fichier/ }).click();

  await expect(page.getByText(/Bravo, le fichier est conforme !/)).toBeVisible();

  await page.getByRole('button', { name: /Suivant/ }).click();

  await expect(page.getByRole('heading', { name: /Étape 3 sur 3/ })).toBeVisible();

  await page.getByRole('button', { name: /Transmettre les données/ }).first().click();

  await expect(page.getByText(/Les données ont été importées avec succès pour l’indicateur IND-510/)).toBeVisible();
});
