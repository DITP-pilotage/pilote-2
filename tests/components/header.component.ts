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

  private get logoutButton() {
    return this.page.getByRole("button", { name: "Se déconnecter" });
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.waitFor({ state: "visible" });
    await this.loginButton.click();
  }

  async logout(): Promise<void> {
    const userOrLogin = this.userButton().or(this.loginButton);
    await userOrLogin.first().waitFor({ state: "visible", timeout: 30_000 });

    if (await this.userButton().isVisible()) {
      await this.userButton().click();
      await this.logoutButton.click();
      await this.loginButton.waitFor({ state: "visible" });
    }
  }

  async expectUserLoggedIn(): Promise<void> {
    await expect(this.userButton()).toBeVisible({ timeout: 100_000 });
  }
}
