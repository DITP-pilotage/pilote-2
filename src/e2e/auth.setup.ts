// auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.getByLabel('Email').type('ditp.admin@example.com');
  await page.getByLabel('Mot de Passe').type(process.env.DEV_PASSWORD!);
  await page.getByRole('button').click();

  await page.waitForURL('/');

  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toContainText(/chantiers/i);

  await page.context().storageState({ path: authFile });
});
