import { Page, expect } from "@playwright/test";

export class HeaderComponent {
  constructor(private readonly page: Page) {}

  private get banner() {
    return this.page.getByRole("banner");
  }

  get loginButton() {
    return this.banner.getByRole("button", { name: "Se connecter" });
  }

  userButton() {
    return this.banner.getByRole("button", { name: "Mon espace" });
  }

  async clickLogin(): Promise<void> {
    // Attendre que l'hydration Next.js soit terminée avant de cliquer
    await this.page.waitForLoadState("networkidle");
    await this.loginButton.click();
  }

  async expectUserLoggedIn(): Promise<void> {
    await expect(this.userButton()).toBeVisible({ timeout: 100_000 });
  }
}
