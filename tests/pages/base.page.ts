import { Page } from "@playwright/test";
import { E2ETestContext } from "../e2e-test-context";

export abstract class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly e2eContext: E2ETestContext,
  ) {}
}
