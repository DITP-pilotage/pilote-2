import { Page } from 'playwright-core';
import { expect } from '@playwright/test';

export const loginFn = async ({ page }: { page: Page }) => {
  await page.goto('http://localhost:3000');

  // Click the get started link.
  await page.getByRole('banner').getByRole('button', { name: 'Se connecter' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page).toHaveTitle(/Sign In/);

  await page.getByLabel('Email').fill('tristan.conti@seenovate.com');
  await page.getByLabel(/Mot de Passe/).fill('password');

  await page.getByRole('button').click();

  await expect(page).toHaveTitle(/PILOTE - Piloter l’action publique par les résultats/);
};
