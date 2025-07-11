import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 2,
  globalTimeout: 120_000,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter à utiliser. Voir https://playwright.dev/docs/test-reporters */
  reporter: process.env.ENVIRONMENT === 'E2E'
    ? [['github']]
    : [['html', { open: 'always' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    // Configuration spéciale pour Scalingo (environnement E2E)
    ...(process.env.ENVIRONMENT === 'E2E' && {
      // Désactiver les vidéos et screenshots pour économiser les ressources
      headless: true,
      video: 'retain-on-failure',
      screenshot: 'only-on-failure',
      // Timeout plus court sur Scalingo
      actionTimeout: 10000,
      navigationTimeout: 30000,
      acceptDownloads: true,  
      ignoreHTTPSErrors: true,
      waitForLoadState: 'networkidle',
    }),
  },

  /* Configure projects for major browsers */
  projects: process.env.ENVIRONMENT === 'E2E' 
    ? [
        {
          name: 'chromium-headless',
          use: {
            ...devices['Desktop Chrome'],
            headless: true,
            launchOptions: {
              headless: true,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
              ],
            },
          },
        },
      ] : [
        // Configuration normale pour le développement
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
          },
        },
      ],
});
