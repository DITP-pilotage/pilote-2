import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class PageUtilisateurFormulaire extends BasePage {
  async gotoCreer(): Promise<void> {
    await this.page.goto("/admin/utilisateur/creer");
    await expect(
      this.page.getByRole("heading", { name: "Identification" }),
    ).toBeVisible({ timeout: 30_000 });
  }

  private get emailInput() {
    return this.page.getByRole("textbox", { name: "Adresse électronique" });
  }

  private get nomInput() {
    return this.page.getByRole("textbox", { name: /^Nom/ });
  }

  private get prenomInput() {
    return this.page.getByRole("textbox", { name: "Prénom" });
  }

  private get fonctionInput() {
    return this.page.getByRole("textbox", { name: "Fonction" });
  }

  private get boutonSuivant() {
    return this.page.getByRole("button", { name: "Suivant" });
  }

  private get blocFonction() {
    return this.page.locator(".fr-input-group", {
      has: this.page.locator("label", { hasText: "Fonction" }),
    });
  }

  private get blocService() {
    return this.page.locator(".fr-input-group", {
      has: this.page.locator("label", { hasText: "Service" }),
    });
  }

  async remplirIdentification(data: {
    email: string;
    nom: string;
    prenom: string;
  }): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.nomInput.fill(data.nom);
    await this.prenomInput.fill(data.prenom);
  }

  async remplirFonction(fonction: string): Promise<void> {
    await this.fonctionInput.fill(fonction);
  }

  async selectService(serviceName: string): Promise<void> {
    await this.page.getByLabel(/^Service/).click();
    await this.page.getByRole("option", { name: serviceName }).click();
  }

  async selectProfil(profilName: string): Promise<void> {
    await this.page
      .locator("select[name='profil']")
      .selectOption({ label: profilName });
  }

  async clickSuivant(): Promise<void> {
    await this.boutonSuivant.click();
  }

  async expectErreurFonction(): Promise<void> {
    await expect(this.blocFonction.locator(".fr-error-text")).toBeVisible();
  }

  async expectErreurService(): Promise<void> {
    await expect(this.blocService.locator(".fr-error-text")).toBeVisible();
  }

  async expectPasErreurFonction(): Promise<void> {
    await expect(this.blocFonction.locator(".fr-error-text")).not.toBeVisible();
  }

  async expectPasErreurService(): Promise<void> {
    await expect(this.blocService.locator(".fr-error-text")).not.toBeVisible();
  }
}
