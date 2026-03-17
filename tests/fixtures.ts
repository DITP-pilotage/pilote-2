import { test as base } from "@playwright/test";
import { E2ETestContext } from "./e2e-test-context";

export const test = base.extend<{ e2eContext: E2ETestContext }>({
  e2eContext: async ({}, use) => {
    const context = new E2ETestContext();
    await use(context);
    await context.cleanup();
  },
});
