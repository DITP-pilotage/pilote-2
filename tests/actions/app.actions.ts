import { Page } from "@playwright/test";
import { PageAccueilNonConnecte } from "../pages/page-accueil-non-connecte";
import { PageLogin } from "../pages/page-login";
import { PageAccueil } from "../pages/page-accueil";
import { HeaderComponent } from "../components/header.component";
import { E2ETestContext } from "../e2e-test-context";

export class AppActions {
  constructor(
    private readonly page: Page,
    private readonly e2eContext: E2ETestContext,
  ) {}

  async loginAs(
    username = process.env.E2E_USERNAME!,
    password = process.env.DEV_PASSWORD!,
  ): Promise<PageAccueil> {
    const pageAccueilNonConnecte = new PageAccueilNonConnecte(
      this.page,
      this.e2eContext,
    );
    await pageAccueilNonConnecte.goto();
    await pageAccueilNonConnecte.header.clickLogin();

    const pageLogin = new PageLogin(this.page, this.e2eContext);
    await pageLogin.fillCredentials(username, password);
    await pageLogin.submit();

    await this.dismissPostLoginModals();

    await this.page.waitForSelector("div#main");

    return new PageAccueil(this.page, this.e2eContext);
  }

  async switchUser(
    username: string,
    password = process.env.DEV_PASSWORD!,
  ): Promise<PageAccueil> {
    const header = new HeaderComponent(this.page);
    await header.logout();
    return this.loginAs(username, password);
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
