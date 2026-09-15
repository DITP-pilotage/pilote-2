import { Locator, Page } from "@playwright/test";

export class PageConnexion {
  constructor(private readonly page: Page) {}

  get boutonIdentifiantsPilote(): Locator {
    return this.page.getByRole("button", { name: /identifiants PILOTE/ });
  }

  async goto(): Promise<void> {
    await this.page.goto("/connexion");
  }

  async choisirConnexionParIdentifiants(): Promise<void> {
    await this.boutonIdentifiantsPilote.click();
  }
}
