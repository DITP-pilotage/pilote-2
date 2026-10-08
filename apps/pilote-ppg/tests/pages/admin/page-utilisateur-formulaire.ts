import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class PageUtilisateurFormulaire extends BasePage {
  async gotoCreer(): Promise<void> {
    await this.page.goto("/admin/utilisateur/creer");
    await expect(
      this.page.getByRole("heading", { name: "Identification" }),
    ).toBeVisible({ timeout: 30_000 });
  }

  async gotoModifierDepuisFiche(): Promise<void> {
    await this.page.getByRole("link", { name: "Modifier" }).click();
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

  private get champFonction() {
    return this.page.getByLabel("Fonction", { exact: true });
  }

  private get champService() {
    return this.page.locator("#service");
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
    await this.page.getByLabel("Profil", { exact: true }).click();
    await this.page
      .getByRole("option", { name: profilName, exact: true })
      .click();
  }

  async clickSuivant(): Promise<void> {
    await this.boutonSuivant.click();
  }

  async expectErreurFonction(): Promise<void> {
    await expect(this.champFonction).toHaveAttribute("aria-invalid", "true");
  }

  async expectErreurService(): Promise<void> {
    await expect(this.champService).toHaveAttribute("aria-invalid", "true");
  }

  async expectPasErreurFonction(): Promise<void> {
    await expect(
      this.champFonction.and(this.page.locator('[aria-invalid="true"]')),
    ).toHaveCount(0);
  }

  async expectPasErreurService(): Promise<void> {
    await expect(
      this.champService.and(this.page.locator('[aria-invalid="true"]')),
    ).toHaveCount(0);
  }

  async confirmer(): Promise<void> {
    await this.page.getByRole("button", { name: "Confirmer" }).click();
  }

  async expectSuccesModification(): Promise<void> {
    await expect(
      this.page.locator('[role="status"][data-color="success"]'),
    ).toBeVisible({
      timeout: 10_000,
    });
  }
}
