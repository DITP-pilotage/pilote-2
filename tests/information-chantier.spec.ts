import { expect, test } from '@playwright/test';
import { loginFn } from './utils';

test('doit pouvoir consulter les données des chantiers', async ({ page }) => {
  await loginFn({ page });

  await expect(page.getByRole('heading', { name: /\d+ chantiers/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Taux d’avancement moyen/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Taux d’avancement des chantiers par territoire/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Répartition des météos renseignées/ })).toBeVisible();

  await expect(page.getByRole('button', { name: /Transition écologique et Cohésion des territoires/ })).toBeVisible();

  await page.getByRole('button', { name: /Transition écologique et Cohésion des territoires/ }).click();

  await expect(page.locator("button[aria-label='Retirer le tag Cohésion des territoires, ville']")).toBeVisible();
  await expect(page.locator("button[aria-label='Retirer le tag Logement']")).toBeVisible();
  await expect(page.locator("button[aria-label='Retirer le tag Transition Ecologique']")).toBeVisible();
  await expect(page.locator("button[aria-label='Retirer le tag Transports']")).toBeVisible();

  await expect(page.getByRole('table').getByRole('cell', { name: /Transition écologique et Cohésion des territoires/ })).toBeVisible();

  await page.getByRole('table').getByRole('cell', { name: /Transition écologique et Cohésion des territoires/ }).click();

  await expect(page.getByRole('table').getByRole('cell', { name: /Développer le co-voiturage/ })).toBeVisible();

  await page.getByRole('table').getByRole('cell', { name: /Développer le co-voiturage/ }).click();

  await expect(page).toHaveTitle(/Chantier 046 - Développer le co-voiturage - PILOTE/);

  await expect(page.getByRole('heading', { name: /Avancement du chantier/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Taux d’avancement national/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Responsables/ })).toBeVisible();
  await expect(page.getByText( /Minimum/ )).toBeVisible();
  await expect(page.getByText( /Médiane/ )).toBeVisible();
  await expect(page.getByText( /Maximum/ )).toBeVisible();
  await expect(page.getByRole('heading', { name: /Météo et synthèse des résultats/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Répartition géographique/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Taux d'avancement 2026/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Niveau de confiance/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Objectifs/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Notre ambition/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ce qui a déjà été fait/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ce qui reste à faire/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Indicateurs$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Indicateurs d'impact$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Nombre de trajets quotidiens effectués en covoiturage \(en million\)$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Nombre de trajets quotidiens effectués en covoiturage intermédié \(en million\)$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Tonnes de CO2 évités par an \(en million\)$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Indicateurs de déploiement$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Décisions stratégiques$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Suivi des décisions stratégiques$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Commentaires du chantier$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Autres résultats obtenus \(non corrélés aux indicateurs\)$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Risques et freins à lever$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Solutions et actions à venir$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Exemples concrets de réussite$/ })).toBeVisible();
});
