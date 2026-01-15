import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { HeaderComponent } from "../components/header.component";

export class PageAccueilNonConnecte extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async expectTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(
      /PILOTE - Piloter l'action publique par les résultats/,
    );
  }
}
