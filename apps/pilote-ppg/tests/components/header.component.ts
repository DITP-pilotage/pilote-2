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
      await expect(async () => {
        await this.userButton().click();
        await this.logoutButton.waitFor({ state: "visible", timeout: 5_000 });
      }).toPass({ timeout: 15_000 });

      await this.logoutButton.click();

      // Le click déclenche next-auth signOut() qui POST /api/auth/signout
      // puis redirige vers "/". On attend que cette navigation soit terminée
      // avant de vérifier l'état des cookies.
      await this.page.waitForLoadState("load");

      // Dans next-auth v5 beta, le cookie de session peut persister à cause
      // d'une race avec un refresh de session concurrent en vol au moment du
      // signOut. On force la suppression si nécessaire. On utilise reload()
      // plutôt que goto("/") : la page est déjà sur "/" et une nouvelle
      // navigation via portless/HTTP2 peut lever ERR_ABORTED si des requêtes
      // background sont encore en cours d'annulation.
      const sessionCookieName = "session-token";
      const cookies = await this.page.context().cookies();
      const sessionStillPresent = cookies.some((cookie) =>
        cookie.name.includes(sessionCookieName),
      );

      if (sessionStillPresent) {
        await this.page.context().clearCookies({ name: /session-token/ });
        await this.page.reload({ waitUntil: "domcontentloaded" });
      }

      await this.loginButton.waitFor({ state: "visible", timeout: 30_000 });
    }
  }

  async expectUserLoggedIn(): Promise<void> {
    await expect(this.userButton()).toBeVisible({ timeout: 100_000 });
  }

  async expectUserLoggedOut(): Promise<void> {
    await expect(this.loginButton).toBeVisible({ timeout: 100_000 });
  }
}
