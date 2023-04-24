/* eslint-disable import/no-extraneous-dependencies */
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.getByLabel('Email').type('ditp.admin@example.com');
  await page.getByLabel('Mot de Passe').type(process.env.DEV_PASSWORD!);
  await page.getByRole('button').click();

  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toContainText(/chantiers/i);
});
