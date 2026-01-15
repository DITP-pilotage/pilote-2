import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class PageLogin extends BasePage {
  private get usernameInput() {
    return this.page.getByLabel("Identifiant");
  }

  private get passwordInput() {
    return this.page.getByLabel(/Mot de passe/);
  }

  private get submitButton() {
    return this.page.getByRole("button");
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForURL("**/accueil/chantier/**");
    await expect(this.page).toHaveTitle(
      /PILOTE - Piloter l'action publique par les résultats/,
    );
  }
}
