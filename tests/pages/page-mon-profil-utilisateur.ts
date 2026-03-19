import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { E2ETestContext } from "../e2e-test-context";

export class PageMonProfilUtilisateur extends BasePage {
  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
  }

  async goto(): Promise<void> {
    await this.page.goto("/mon-profil-utilisateur");
    await expect(
      this.page.getByRole("heading", { name: "Mon profil utilisateur" }),
    ).toBeVisible({ timeout: 30_000 });
  }

  private get titre() {
    return this.page.getByRole("heading", {
      name: "Mon profil utilisateur",
      level: 1,
    });
  }

  private get sectionIdentification() {
    return this.page.getByRole("heading", { name: "Identification" });
  }

  private get mentionChampsObligatoires() {
    return this.page.getByText("Tous les champs sont obligatoires.");
  }

  private get emailInput() {
    return this.page.getByRole("textbox", { name: "Adresse électronique" });
  }

  private get prenomInput() {
    return this.page.getByRole("textbox", { name: "Prénom" });
  }

  private get nomInput() {
    return this.page.getByRole("textbox", { name: /^Nom\*?$/ });
  }

  private get fonctionInput() {
    return this.page.getByRole("textbox", { name: "Fonction" });
  }

  private get boutonEnregistrer() {
    return this.page.getByRole("button", { name: "Enregistrer" });
  }

  private get dateModification() {
    return this.page.getByText(/Modifié le \d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}/);
  }

  private get alerteSucces() {
    return this.page.getByText(
      "Vos informations ont été modifiées avec succès",
    );
  }

  private get champPrecisezService() {
    return this.page.getByRole("textbox", { name: "Précisez votre service" });
  }

  private get messageAideServiceAutre() {
    return this.page.getByText(
      "Afin de nous aider à compléter cette liste, merci de nous indiquer votre rattachement.",
    );
  }

  async expectStructure(): Promise<void> {
    await expect(this.titre).toBeVisible();
    await expect(this.sectionIdentification).toBeVisible();
    await expect(this.mentionChampsObligatoires).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.prenomInput).toBeVisible();
    await expect(this.nomInput).toBeVisible();
    await expect(this.fonctionInput).toBeVisible();
    await expect(this.boutonEnregistrer).toBeVisible();
    await expect(this.dateModification).toBeVisible();
  }

  async expectEmailDisabled(): Promise<void> {
    await expect(this.emailInput).toBeDisabled();
  }

  async expectChampsPreremplis(data: {
    email: string;
    prenom: string;
    nom: string;
  }): Promise<void> {
    await expect(this.emailInput).toHaveValue(data.email);
    await expect(this.prenomInput).toHaveValue(data.prenom);
    await expect(this.nomInput).toHaveValue(data.nom);
  }

  async getDateModificationText(): Promise<string> {
    return this.dateModification.innerText();
  }

  async modifierFonctionEtEnregistrer(
    email: string,
    ancienneFonction: string,
    nouvelleFonction: string,
  ): Promise<void> {
    this.e2eContext.track("PROFIL_UTILISATEUR_MODIFIE", {
      email,
      originalData: { fonction: ancienneFonction },
    });
    await this.fonctionInput.clear();
    await this.fonctionInput.fill(nouvelleFonction);
    await this.boutonEnregistrer.click();
  }

  async expectSucces(): Promise<void> {
    await expect(this.alerteSucces).toBeVisible({ timeout: 10_000 });
  }

  async selectService(serviceName: string): Promise<void> {
    await this.page.getByLabel(/^Service/).click();
    await this.page.getByRole("option", { name: serviceName }).click();
  }

  async expectChampServiceAutreVisible(): Promise<void> {
    await expect(this.champPrecisezService).toBeVisible();
    await expect(this.messageAideServiceAutre).toBeVisible();
  }

  async expectChampServiceAutreNonVisible(): Promise<void> {
    await expect(this.champPrecisezService).not.toBeVisible();
  }
}
