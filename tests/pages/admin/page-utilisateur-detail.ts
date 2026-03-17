import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class PageUtilisateurDetail extends BasePage {
  private get heading() {
    return this.page.getByRole("heading", { name: "Fiche du compte" });
  }

  private get bandeauInfo() {
    return this.page.locator(".fr-notice .fr-notice__title");
  }

  private get boutonModifier() {
    return this.page.getByRole("link", { name: "Modifier" });
  }

  private get boutonGenererToken() {
    return this.page.getByRole("button", {
      name: /Générer un token/,
    });
  }

  private get boutonDesactiver() {
    return this.page.getByText("Désactiver le compte");
  }

  private get boutonReactiver() {
    return this.page.getByRole("button", { name: /Réactiver le compte/ });
  }

  private get badgeDesactive() {
    return this.page.locator(".fr-badge--error", {
      hasText: "Désactivé depuis",
    });
  }

  private get dialog() {
    return this.page.getByRole("dialog");
  }

  async goto(utilisateurId: string): Promise<void> {
    await this.page.goto(`/admin/utilisateur/${utilisateurId}`);
    await this.heading.waitFor({ state: "visible" });
  }

  async confirmerDesactivation(email: string): Promise<void> {
    this.e2eContext.track("UTILISATEUR_DESACTIVE", { email });

    await this.dialog
      .getByRole("button", { name: "Confirmer la désactivation" })
      .click();
  }

  async confirmerReactivation(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: "Confirmer la réactivation" })
      .click();
  }

  async genererToken(): Promise<void> {
    await this.boutonGenererToken.click();
  }

  async expectPageChargee(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async expectInfoUtilisateur(
    email: string,
    nom: string,
    prenom: string,
    profil: string,
  ): Promise<void> {
    await expect(this.page.locator("main")).toContainText(email);
    await expect(this.page.locator("main")).toContainText(nom);
    await expect(this.page.locator("main")).toContainText(prenom);
    await expect(this.page.locator("main")).toContainText(profil);
  }

  async expectModifierVisible(): Promise<void> {
    await expect(this.boutonModifier).toBeVisible();
  }

  async expectModifierNotVisible(): Promise<void> {
    await expect(this.boutonModifier).not.toBeVisible();
  }

  async expectDesactiverVisible(): Promise<void> {
    await expect(this.boutonDesactiver).toBeVisible();
  }

  async expectDesactiverNotVisible(): Promise<void> {
    await expect(this.boutonDesactiver).not.toBeVisible();
  }

  async expectReactiverVisible(): Promise<void> {
    await expect(this.boutonReactiver).toBeVisible();
  }

  async expectReactiverNotVisible(): Promise<void> {
    await expect(this.boutonReactiver).not.toBeVisible();
  }

  async expectTokenVisible(): Promise<void> {
    await expect(this.boutonGenererToken).toBeVisible();
  }

  async expectTokenNotVisible(): Promise<void> {
    await expect(this.boutonGenererToken).not.toBeVisible();
  }

  async expectBandeauRestriction(message: string | RegExp): Promise<void> {
    await expect(this.bandeauInfo).toBeVisible();
    await expect(this.bandeauInfo).toHaveText(message);
  }

  async expectPasDeBandeau(): Promise<void> {
    await expect(this.bandeauInfo).not.toBeVisible();
  }

  async expectDesactive(): Promise<void> {
    await expect(this.badgeDesactive).toBeVisible();
  }

  async expectActif(): Promise<void> {
    await expect(this.badgeDesactive).not.toBeVisible();
  }
}
