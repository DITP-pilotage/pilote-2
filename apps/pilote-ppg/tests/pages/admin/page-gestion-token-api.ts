import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class PageGestionTokenApi extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/admin/gestion-token-api");
  }

  async createToken(email: string): Promise<string> {
    await expect(this.page.getByText(email)).not.toBeVisible();

    await this.page.getByLabel("Émail").fill(email);

    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/gestionTokenAPI.creerTokenAPI") &&
        response.request().method() === "POST",
    );

    await this.page.getByRole("button", { name: /Créer un token API/ }).click();

    const response = await responsePromise;
    const responseBody = await response.json();

    return responseBody[0].result.data.json;
  }

  async deleteToken(email: string): Promise<void> {
    await expect(this.page.getByRole("cell", { name: email })).toBeVisible();

    await this.page
      .getByRole("cell", { name: email })
      .locator("..")
      .getByRole("button", { name: /Supprimer le token API/ })
      .click();
  }
}
