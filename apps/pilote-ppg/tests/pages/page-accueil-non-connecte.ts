import { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { HeaderComponent } from "../components/header.component";
import { E2ETestContext } from "../e2e-test-context";

export class PageAccueilNonConnecte extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
    this.header = new HeaderComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }
}
