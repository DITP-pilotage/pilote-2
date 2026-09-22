import { Page } from "@playwright/test";
import { PageAccueilNonConnecte } from "../pages/page-accueil-non-connecte";
import { PageConnexion } from "../pages/page-connexion";
import { PageLogin } from "../pages/page-login";
import { PageAccueil } from "../pages/page-accueil";
import { E2ETestContext } from "../e2e-test-context";

export class AppActions {
  constructor(
    private readonly page: Page,
    private readonly e2eContext: E2ETestContext,
  ) {}

  /**
   * Connexion par l'API NextAuth plutôt que par le formulaire : le provider
   * credentials est appelé directement, ce qui pose le cookie de session dans le
   * contexte sans traverser les quatre pages du parcours de connexion. Le parcours
   * complet reste couvert par `loginViaFormulaire`.
   */
  async loginAs(
    username = process.env.E2E_USERNAME!,
    password = process.env.DEV_PASSWORD!,
  ): Promise<PageAccueil> {
    await this.loginViaCookie(username, password);

    await this.page.goto("/");
    await this.dismissPostLoginModals();
    await this.page.waitForSelector("div#main");

    return new PageAccueil(this.page, this.e2eContext);
  }

  async loginViaFormulaire(
    username = process.env.E2E_USERNAME!,
    password = process.env.DEV_PASSWORD!,
  ): Promise<PageAccueil> {
    const pageAccueilNonConnecte = new PageAccueilNonConnecte(
      this.page,
      this.e2eContext,
    );
    await pageAccueilNonConnecte.goto();
    await pageAccueilNonConnecte.header.clickLogin();

    // L'écran de choix du mode de connexion s'intercale entre le point d'entrée
    // de l'en-tête et le formulaire.
    const pageConnexion = new PageConnexion(this.page);
    await pageConnexion.choisirConnexionParIdentifiants();

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
    await this.page.context().clearCookies();
    return this.loginAs(username, password);
  }

  private async loginViaCookie(
    username: string,
    password: string,
  ): Promise<void> {
    // Le proxy portless (HTTP/2) coupe parfois une connexion à froid sous charge :
    // on retente les deux requêtes plutôt que de faire échouer le test.
    const { csrfToken } = (await this.retry(async () =>
      (await this.page.request.get("/api/auth/csrf")).json(),
    )) as { csrfToken: string };

    const reponse = await this.retry(() =>
      this.page.request.post("/api/auth/callback/credentials", {
        form: { csrfToken, username, password, callbackUrl: "/" },
        maxRedirects: 0,
      }),
    );

    const redirection = reponse.headers().location ?? "";
    const cookies = await this.page.context().cookies();
    const sessionPosee = cookies.some((cookie) =>
      cookie.name.includes("session-token"),
    );
    if (!sessionPosee || /error=/.test(redirection)) {
      throw new Error(
        `Connexion refusée pour ${username} (statut ${reponse.status()}, redirection vers ${redirection})`,
      );
    }
  }

  private async retry<T>(action: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
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
