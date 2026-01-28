import { defineConfig, devices } from "@playwright/test";

/**
 * Load environment variables from .env.e2e file
 */
require("dotenv").config({ path: ".env.e2e" });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 2,
  globalTimeout: 2_000_000,
  outputDir: process.env.CI ? "test-results" : "/tmp/pilote-playwright/results",
  /* Run serially for test isolation */
  workers: 1,
  /* Reporter à utiliser. Voir https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["github"], ["json", { outputFile: "test-results/results.json" }]]
    : [["html", { open: "always", outputFolder: "/tmp/pilote-playwright/report" }]],
  webServer: {
    command: "npm run test:e2e:server",
    timeout: 120_000,
    url: process.env.BASE_URL!,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 150_000,
    acceptDownloads: true,
  },

  /* Configure projects for major browsers */
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
  ],
});
