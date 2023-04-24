// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@playwright/test';

test("L'utilisateur accède au chantier voulu depuis la page d'accueil en utilisant le filtre 'ministère'", async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main').getByRole('heading', { level: 2, name: /Liste des chantiers/ })).toBeVisible();

  const filtres = page.getByTitle('filtres').getByRole('list', { name: 'Liste des filtres ministères' });
  await expect(filtres).toBeVisible();
  await filtres.getByRole('button', { name: 'Agriculture et Alimentation' }).click();

  const tagDuFiltreAgricultureEtAlimentation = page.getByRole('list', { name: 'liste des tags des filtres actifs' }).getByRole('listitem', { name: 'Agriculture' });
  expect(tagDuFiltreAgricultureEtAlimentation).toBeDefined();

  const tableau = page.getByRole('table', { name: 'Liste des chantiers' });
  await expect(tableau.getByRole('row')).toHaveCount(2);
  const ligneChantier = tableau.getByRole('row', { name: 'CH-123 Chantier test' });

  await ligneChantier.click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('CH-123 Chantier test');
});
