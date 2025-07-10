import { Page } from 'playwright-core';
import { expect, test } from '@playwright/test';
import { configuration } from '@/config';

export const loginFn = async ({ page }: { page: Page }) => {
  const username = configuration.e2e.username;
  const password = configuration.e2e.password;

  await test.step(`Authentification de l'utilisateur ${username} avec le rôle DITP_ADMIN`, async () => {
    await page.goto('http://localhost:3000');

    // Click the get started link.
    await page.getByRole('banner').getByRole('button', { name: 'Se connecter' }).click();

    // Expects page to have a heading with the name of Installation.
    await expect(page).toHaveTitle(/Sign In/);

    await page.getByLabel('Identifiant').fill(username);
    await page.getByLabel(/Mot de passe/).fill(password);

    await page.getByRole('button').click();

    await page.waitForURL('**/accueil/chantier/**');

    await expect(page).toHaveTitle(/PILOTE - Piloter l'action publique par les résultats/);
  });
};
