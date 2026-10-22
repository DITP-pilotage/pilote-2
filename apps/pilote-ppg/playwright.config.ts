import { defineConfig, devices } from "@playwright/test";

/**
 * Load environment variables from .env.e2e file
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env.e2e" });

const videoEnabled = process.env.E2E_VIDEO === "on";

/* Specs d'appels directs (API, tRPC, open-api) : le navigateur n'y change rien. */
const NON_UI_SPECS = [
  "**/api-autorisation.spec.ts",
  "**/open-api/**",
  "**/export-csv-cloisonnement.spec.ts",
  "**/gardes-panel-admin.spec.ts",
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  globalTimeout: 3_600_000,
  outputDir: process.env.CI ? "test-results" : "/tmp/pilote-playwright/results",
  /* Un fichier = un worker ; les tests d'un même fichier restent en série sauf opt-in
     par test.describe.configure. Le runner CI n'a que deux vCPU. */
  workers: process.env.CI ? 2 : 4,
  /* Reporter à utiliser. Voir https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["github"], ["json", { outputFile: "test-results/results.json" }]]
    : [
        ["list"],
        [
          "html",
          {
            open: videoEnabled ? "always" : "on-failure",
            outputFolder: "/tmp/pilote-playwright/report",
          },
        ],
      ],
  webServer: {
    command: "prisma generate && pnpm test:e2e:server",
    timeout: 120_000,
    url: process.env.BASE_URL!,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    ignoreHTTPSErrors: true,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* "retain-on-failure" enregistre toujours et ne jette qu'à la fin : hors E2E_VIDEO=on, on coupe vraiment. */
    video: videoEnabled ? "on" : "off",
    screenshot: "only-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 45_000,
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
  },

  /* Firefox puis WebKit s'enchaînent après Chromium : les trois partagent la même base
     seedée, ils ne doivent jamais écrire en parallèle sur les mêmes entités. */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI && {
          headless: true,
          launchOptions: {
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
            ],
          },
        }),
      },
    },
    {
      name: "firefox",
      dependencies: ["chromium"],
      testIgnore: NON_UI_SPECS,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      dependencies: ["firefox"],
      testIgnore: NON_UI_SPECS,
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
