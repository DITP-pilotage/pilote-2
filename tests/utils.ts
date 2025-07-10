import { Page } from 'playwright-core';
import { expect, test } from '@playwright/test';

import { configuration } from '@/config';

export const loginFn = async ({ page }: { page: Page }) => {
  const username = configuration.e2e.username;
  const password = configuration.e2e.password;

  await test.step(`Authentification de l'utilisateur ${username} avec le rôle DITP_ADMIN`, async () => {
    await page.goto(configuration.nextAuth.url);

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

export const authentificationApiFn = async ({ page, apiUsername }: { page: Page, apiUsername: string }): Promise<{ apiToken: string; }> => {
  let apiToken: string = '';

  await loginFn({ page });

  await test.step(`Création du token API pour l'utilisateur ${apiUsername}`, async () => {
    await page.goto(`${configuration.nextAuth.url}/admin/gestion-token-api`);
    await page.waitForURL('**/admin/gestion-token-api')

    expect(page.getByText(apiUsername)).not.toBeVisible()

    await page.getByLabel('Émail').fill(apiUsername);

    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/trpc/gestionTokenAPI.creerTokenAPI') && 
      response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: /Créer un token API/ }).click();

    const response = await responsePromise;
    const responseBody = await response.json();

    apiToken = responseBody[0].result.data.json
  });

  return { apiToken };
};

export const authentificationApiDITPADMINFn = async ({ page }: { page: Page }): Promise<{ apiDITPADMINToken: string; apiDITPADMINUsername: string }> => {
  const apiDITPADMINUsername = configuration.e2e.apiDITPADMINUsername;

  const  { apiToken } = await authentificationApiFn({ page, apiUsername: apiDITPADMINUsername })
  
  return { apiDITPADMINUsername, apiDITPADMINToken: apiToken };
};

export const authentificationApiDirProjetFn = async ({ page }: { page: Page }): Promise<{ apiDirProjetToken: string; apiDirProjetUsername: string; apiDirProjetChantierAssocie: string; apiDirProjetIndicateurAssocie: string }> => {
  const apiDirProjetUsername = configuration.e2e.apiDirProjetUsername;
  const apiDirProjetChantierAssocie = configuration.e2e.apiDirProjetChantierAssocie;
  const apiDirProjetIndicateurAssocie = configuration.e2e.apiDirProjetIndicateurAssocie;

  const  { apiToken } = await authentificationApiFn({ page, apiUsername: apiDirProjetUsername })

  return { apiDirProjetUsername, apiDirProjetToken: apiToken, apiDirProjetChantierAssocie, apiDirProjetIndicateurAssocie };
};

export const suppressionAuthentificationApiFn = async ({ page, apiUsername }: { page: Page, apiUsername: string }): Promise<{ apiToken: string; }> => {
  let apiToken: string = '';

  await test.step(`Suppression du token API pour l'utilisateur ${apiUsername}`, async () => {
    await page.goto(`${configuration.nextAuth.url}/admin/gestion-token-api`);
    await page.waitForURL('**/admin/gestion-token-api');

    expect(page.getByText(apiUsername)).toBeVisible()

    await page.getByText(apiUsername).locator('..').getByRole('button', { name: /Supprimer le token API/ }).click();

    await page.waitForURL('**/admin/gestion-token-api?_action=suppression-reussie');
  });

  return { apiToken };
};