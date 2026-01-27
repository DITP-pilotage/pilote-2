import { Page } from "@playwright/test";
import { PageAccueilNonConnecte } from "../pages/page-accueil-non-connecte";
import { PageLogin } from "../pages/page-login";
import { PageAccueil } from "../pages/page-accueil";

export class AppActions {
  constructor(private readonly page: Page) {}

  async loginAs(
    username = process.env.E2E_USERNAME!,
    password = process.env.DEV_PASSWORD!,
  ): Promise<PageAccueil> {
    const pageAccueilNonConnecte = new PageAccueilNonConnecte(this.page);
    await pageAccueilNonConnecte.goto();
    await pageAccueilNonConnecte.header.clickLogin();

    const pageLogin = new PageLogin(this.page);
    await pageLogin.fillCredentials(username, password);
    await pageLogin.submit();

    await this.dismissPostLoginModals();

    await this.page.waitForSelector("div#main");

    return new PageAccueil(this.page);
  }

  private async dismissPostLoginModals(): Promise<void> {
    const videoModal = this.page
      .getByRole("dialog")
      .getByRole("button", { name: /vidéo/ });
    const newsletterModal = this.page.getByRole("button", { name: /Fermer.*/ });

    if (await videoModal.isVisible({ timeout: 4000 }).catch(() => false)) {
      await videoModal.click();
    }
    if (await newsletterModal.isVisible({ timeout: 4000 }).catch(() => false)) {
      await newsletterModal.click();
    }
  }
}
