import { test, expect } from '@playwright/test';

test("L'utilisateur accède au chantier voulu depusi la page d'accueil", async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toContainText(/chantiers/i);
});
