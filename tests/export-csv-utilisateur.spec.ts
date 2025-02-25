import { test } from '@playwright/test';
import { loginFn } from './utils';

test('doit pouvoir exporter les données des chantiers sous format CSV', async ({ page }) => {
  await loginFn({ page });
  test.setTimeout(150_000);

  await test.step('Navigation vers la page Utilisateur', async () => {
    await page.getByRole('link', { name: /Gestion des comptes/ }).click();
    await page.waitForURL('**/admin/utilisateurs');
    await page.getByRole('link', { name: /Exporter les utilisateurs/ }).click({ force: true });
  });
});
