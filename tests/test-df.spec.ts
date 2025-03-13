import { test } from '@playwright/test';

test('doit pouvoir exporter les données des chantiers sous format CSV', async ({ page }) => {
  await test.step('partie téléchargement et vérification du fichier', async () => {
    test.setTimeout(400_000);
    // eslint-disable-next-line unicorn/prefer-module
    require('node:child_process').execSync('bash exec-df.sh');
  });
});
