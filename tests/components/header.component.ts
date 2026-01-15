import { Page, expect } from "@playwright/test";

export class HeaderComponent {
  constructor(private readonly page: Page) {}

  private get banner() {
    return this.page.getByRole("banner");
  }

  get loginButton() {
    return this.banner.getByRole("button", { name: "Se connecter" });
  }

  userButton(username: string) {
    return this.banner.getByRole("button", { name: username });
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async expectUserLoggedIn(username: string): Promise<void> {
    await expect(this.userButton(username)).toBeVisible();
  }
}
