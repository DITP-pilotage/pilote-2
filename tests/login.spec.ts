import { expect, test } from '@playwright/test';
import { loginFn } from './utils';

test('doit arriver sur la landing page', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/PILOTE - Piloter l’action publique par les résultats/);
});

test('doit pouvoir se connecter', async ({ page }) => {
  await loginFn({ page });

  await expect(page.getByRole('banner').getByRole('button', { name: 'tristan.conti@seenovate.com' })).toBeVisible();
});
