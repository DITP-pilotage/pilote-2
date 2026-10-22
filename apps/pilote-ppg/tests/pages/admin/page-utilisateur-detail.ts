import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class PageUtilisateurDetail extends BasePage {
  private get heading() {
    return this.page.getByRole("heading", { name: "Fiche du compte" });
  }

  private get infoBanner() {
    return this.page.getByRole("main").getByRole("note");
  }

  private get editButton() {
    return this.page.getByRole("link", { name: "Modifier" });
  }

  private get generateTokenButton() {
    return this.page.getByRole("button", {
      name: /Générer un token/,
    });
  }

  private get deactivateButton() {
    return this.page.getByText("Désactiver le compte");
  }

  private get reactivateButton() {
    return this.page.getByRole("button", { name: /Réactiver le compte/ });
  }

  private get deactivatedBadge() {
    return this.page.getByText(/^Désactivé depuis le /);
  }

  private get dialog() {
    return this.page.getByRole("dialog");
  }

  async confirmDeactivation(email: string): Promise<void> {
    this.e2eContext.track("UTILISATEUR_DEACTIVATED", { email });

    await this.dialog
      .getByRole("button", { name: "Confirmer la désactivation" })
      .click();
  }

  async confirmReactivation(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: "Confirmer la réactivation" })
      .click();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async expectUtilisateurInfo(
    email: string,
    name: string,
    prenom: string,
    profil: string,
  ): Promise<void> {
    await expect(this.page.locator("main")).toContainText(email);
    await expect(this.page.locator("main")).toContainText(name);
    await expect(this.page.locator("main")).toContainText(prenom);
    await expect(this.page.locator("main")).toContainText(profil);
  }

  async expectEditVisible(): Promise<void> {
    await expect(this.editButton).toBeVisible();
  }

  async expectEditNotVisible(): Promise<void> {
    await expect(this.editButton).not.toBeVisible();
  }

  async expectDeactivateVisible(): Promise<void> {
    await expect(this.deactivateButton).toBeVisible();
  }

  async expectDeactivateNotVisible(): Promise<void> {
    await expect(this.deactivateButton).not.toBeVisible();
  }

  async expectReactivateVisible(): Promise<void> {
    await expect(this.reactivateButton).toBeVisible();
  }

  async expectTokenVisible(): Promise<void> {
    await expect(this.generateTokenButton).toBeVisible();
  }

  async expectTokenNotVisible(): Promise<void> {
    await expect(this.generateTokenButton).not.toBeVisible();
  }

  async expectRestrictionBanner(message: string | RegExp): Promise<void> {
    await expect(this.infoBanner).toBeVisible();
    await expect(this.infoBanner).toHaveText(message);
  }

  async expectNoBanner(): Promise<void> {
    await expect(this.infoBanner).not.toBeVisible();
  }

  async expectDeactivated(): Promise<void> {
    await expect(this.deactivatedBadge).toBeVisible();
  }

  async expectActive(): Promise<void> {
    await expect(this.deactivatedBadge).not.toBeVisible();
  }
}
