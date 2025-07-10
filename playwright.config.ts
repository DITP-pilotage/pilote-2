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
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 2,
  globalTimeout: 120_000,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter à utiliser. Voir https://playwright.dev/docs/test-reporters */
  reporter: process.env.ENVIRONMENT === 'E2E'
    ? [
        ['./src/utils/TchapReporter.ts', {
          baseUrl: process.env.TCHAP_BASE_URL,
          accessToken: process.env.TCHAP_ACCESS_TOKEN,
          roomId: process.env.TCHAP_ROOM_ID,
        }],
      ]
    : [['html', { open: 'always' }]], // HTML en développement
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    // Configuration spéciale pour Scalingo (environnement E2E)
    ...(process.env.ENVIRONMENT === 'E2E' && {
      // Désactiver les vidéos et screenshots pour économiser les ressources
      video: 'off',
      screenshot: 'only-on-failure',
      // Timeout plus court sur Scalingo
      actionTimeout: 10000,
      navigationTimeout: 30000,
    }),
  },

  /* Configure projects for major browsers */
  projects: process.env.ENVIRONMENT === 'E2E' 
    ? [
        // Configuration simplifiée pour Scalingo
        {
          name: 'chromium-headless',
          use: {
            ...devices['Desktop Chrome'],
            // Mode headless forcé + options de sécurité pour Scalingo
            headless: true,
          },
        },
      ]
    : [
        // Configuration normale pour le développement
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
          },
        },
      ],

  /* Run your local dev server before starting the tests */
  //webServer: {
  //  command: 'npm run dev',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  //},
});
