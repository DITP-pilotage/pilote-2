import { Page, test as base } from "@playwright/test";
import { disconnectE2EPrisma, E2ETestContext } from "./e2e-test-context";
import {
  ApiTestContext,
  UserProfile,
} from "./open-api/api-client/api-test-context";
import { OpenApiClient } from "./open-api/api-client/open-api.client";
import {
  AuthorizationHeader,
  createUnauthenticatedClient,
} from "./open-api/api-client/unauthenticated-api.client";

type StepWithBanner = (
  stepName: string,
  fn: () => Promise<void>,
) => Promise<void>;

const BANNER_DISPLAY_MS = 1500;

const videoEnabled = process.env.E2E_VIDEO === "on";

// Les pages hors application Next (Keycloak, réponses d'API) n'ont pas de #__next à hydrater.
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      !document.getElementById("__next") ||
      document.body.dataset.hydrated === "true",
  );
}

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

export const test = base.extend<
  {
    e2eContext: E2ETestContext;
    step: StepWithBanner;
    openApi: (profile: UserProfile) => Promise<ApiTestContext>;
    openApiUnauthenticated: (
      authorization?: AuthorizationHeader,
    ) => Promise<OpenApiClient>;
  },
  { e2ePrismaConnection: void }
>({
  e2ePrismaConnection: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use();
      await disconnectE2EPrisma();
    },
    { scope: "worker", auto: true },
  ],
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args) => {
      const response = await goto(...args);
      await waitForHydration(page);
      return response;
    };
    page.reload = async (...args) => {
      const response = await reload(...args);
      await waitForHydration(page);
      return response;
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
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
  openApi: async ({ playwright }, use) => {
    const contexts: ApiTestContext[] = [];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (profile) => {
      const context = await ApiTestContext.create(playwright, profile);
      contexts.push(context);
      return context;
    });
    await Promise.all(contexts.map((context) => context.dispose()));
  },
  openApiUnauthenticated: async ({ playwright }, use) => {
    const clients: OpenApiClient[] = [];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (authorization) => {
      const client = await createUnauthenticatedClient(
        playwright.request,
        authorization,
      );
      clients.push(client);
      return client;
    });
    await Promise.all(clients.map((client) => client.dispose()));
  },
});
