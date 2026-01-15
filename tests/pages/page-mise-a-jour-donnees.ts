import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class PageMiseAJourDonnees extends BasePage {
  async expectTitle(chantierId: string): Promise<void> {
    await expect(this.page).toHaveTitle(
      `Mettre à jour les données - Chantier ${chantierId} - PILOTE`,
    );
  }

  async expectStep(step: number): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: new RegExp(`Étape ${step} sur 3`),
      }),
    ).toBeVisible();
  }

  async selectIndicateur(
    indicateurId: string,
    indicateurNom: string,
  ): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /Sélectionnez l'indicateur/ }),
    ).toBeVisible();
    await this.page.getByLabel("Choix de l'indicateur").selectOption({
      label: `${indicateurId} : ${indicateurNom}`,
    });
  }

  async nextStep(): Promise<void> {
    await this.page.getByRole("button", { name: /Suivant/ }).click();
  }

  async uploadFile(filename: string, csvContent: string): Promise<void> {
    await this.page.getByLabel("Choisir un fichier").setInputFiles({
      name: filename,
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });
  }

  async verifyFile(): Promise<void> {
    await this.page
      .getByRole("button", { name: /Vérifier le fichier/ })
      .click();
  }

  async submitData(): Promise<void> {
    await this.page
      .getByRole("button", { name: /Transmettre les données/ })
      .first()
      .click();
  }

  async expectFileValid(): Promise<void> {
    await expect(
      this.page.getByText(/Bravo, le fichier est conforme !/),
    ).toBeVisible();
  }

  async expectFileInvalid(): Promise<void> {
    await expect(
      this.page.getByText(/Le fichier ne peut pas être importé/),
    ).toBeVisible();
  }

  async expectImportSuccess(indicateurId: string): Promise<void> {
    await expect(
      this.page.getByText(
        `Les données ont été importées avec succès pour l'indicateur ${indicateurId}`,
      ),
    ).toBeVisible();
  }
}
