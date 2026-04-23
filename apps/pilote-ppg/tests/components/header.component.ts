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
        await this.logoutButton.waitFor({ state: "visible", timeout: 2_000 });
      }).toPass({ timeout: 15_000 });

      await this.logoutButton.click();

      // Le click déclenche next-auth signOut() qui POST /api/auth/signout
      // puis redirige. On attend que la navigation déclenchée par signOut
      // soit terminée avant de vérifier l'état des cookies — sinon notre
      // goto de fallback racerait avec la navigation en cours (ERR_ABORTED).
      await this.page.waitForLoadState("load");

      // Dans next-auth v5 beta, le cookie de session (authjs.session-token)
      // peut persister après la redirection à cause d'une race avec une
      // éventuelle refresh de session concurrente. On force sa suppression
      // si nécessaire avant de considérer l'utilisateur comme déconnecté.
      const sessionCookieName = "session-token";
      const cookies = await this.page.context().cookies();
      const sessionStillPresent = cookies.some((cookie) =>
        cookie.name.includes(sessionCookieName),
      );

      if (sessionStillPresent) {
        await this.page.context().clearCookies();
        await this.page.goto("/");
      }

      await this.loginButton.waitFor({ state: "visible", timeout: 30_000 });
    }
  }

  async expectUserLoggedIn(): Promise<void> {
    await expect(this.userButton()).toBeVisible({ timeout: 100_000 });
  }
}
