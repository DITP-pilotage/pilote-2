import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class PageUtilisateurFormulaire extends BasePage {
  async gotoCreate(): Promise<void> {
    await this.page.goto("/admin/utilisateur/creer");
    await expect(
      this.page.getByRole("heading", { name: "Identification" }),
    ).toBeVisible({ timeout: 30_000 });
  }

  async gotoEditFromFiche(): Promise<void> {
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

  private get nextButton() {
    return this.page.getByRole("button", { name: "Suivant" });
  }

  private get fonctionField() {
    return this.page.getByLabel("Fonction", { exact: true });
  }

  private get serviceField() {
    return this.page.locator("#service");
  }

  async fillIdentification(data: {
    email: string;
    nom: string;
    prenom: string;
  }): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.nomInput.fill(data.nom);
    await this.prenomInput.fill(data.prenom);
  }

  async fillFonction(fonction: string): Promise<void> {
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

  async clickNextToReview(): Promise<void> {
    // Chaque réponse renouvelle le cookie csrf : confirmer avant la fin du chargement
    // de l'étape 2 enverrait un jeton périmé.
    const reviewStepLoaded = this.page.waitForResponse(
      /chantier\.recupererTousLesInformationsChantiers/,
    );
    await this.clickNext();
    await reviewStepLoaded;
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  async expectFonctionError(): Promise<void> {
    await expect(this.fonctionField).toHaveAttribute("aria-invalid", "true");
  }

  async expectServiceError(): Promise<void> {
    await expect(this.serviceField).toHaveAttribute("aria-invalid", "true");
  }

  async expectNoFonctionError(): Promise<void> {
    await expect(
      this.fonctionField.and(this.page.locator('[aria-invalid="true"]')),
    ).toHaveCount(0);
  }

  async expectNoServiceError(): Promise<void> {
    await expect(
      this.serviceField.and(this.page.locator('[aria-invalid="true"]')),
    ).toHaveCount(0);
  }

  async confirm(): Promise<void> {
    await this.page.getByRole("button", { name: "Confirmer" }).click();
  }

  async expectUpdateSuccess(): Promise<void> {
    await expect(
      this.page.locator('[role="status"][data-color="success"]'),
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  async expectEmailAlreadyUsedError(): Promise<void> {
    await expect(
      this.page.getByRole("alert").getByRole("heading", {
        name: "Un compte a déjà été créé avec cette adresse électronique.",
      }),
    ).toBeVisible();
  }
}
