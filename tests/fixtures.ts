import { Page, test as base } from "@playwright/test";
import { E2ETestContext } from "./e2e-test-context";

type StepWithBanner = (
  stepName: string,
  fn: () => Promise<void>,
) => Promise<void>;

const BANNER_DISPLAY_MS = 1500;

const videoEnabled = process.env.E2E_VIDEO === "on";

function createStepWithBanner(page: Page): StepWithBanner {
  return async (stepName, fn) => {
    await base.step(stepName, async () => {
      if (videoEnabled) {
        // Injection silencieuse — ignore les erreurs sur les pages cross-origin (ex: Keycloak)
        await page
          .evaluate((text) => {
            const existing = document.getElementById("e2e-step-banner");
            if (existing) existing.remove();

            const banner = document.createElement("div");
            banner.id = "e2e-step-banner";
            banner.textContent = text;
            Object.assign(banner.style, {
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              zIndex: "99999",
              background: "#1e1e2e",
              color: "#fff",
              padding: "8px 16px",
              fontSize: "14px",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            });
            document.body.appendChild(banner);
          }, stepName)
          .catch(() => {});

        await page.waitForTimeout(BANNER_DISPLAY_MS);
      }

      await fn();
    });
  };
}

export const test = base.extend<{
  e2eContext: E2ETestContext;
  step: StepWithBanner;
}>({
  // eslint-disable-next-line no-empty-pattern
  e2eContext: async ({}, use) => {
    const context = new E2ETestContext();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(context);
    await context.cleanup();
  },
  step: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createStepWithBanner(page));
  },
});
