import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class PageMiseAJourDonnees extends BasePage {
  async goto(chantierId: string): Promise<void> {
    await this.page.goto(`/chantier/${chantierId}/indicateurs`);
  }

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
    await this.page.getByLabel("Choix de l'indicateur").click();
    await this.page
      .getByRole("option", { name: `${indicateurId} : ${indicateurNom}` })
      .click();
  }

  async nextStep(): Promise<void> {
    await this.page.getByRole("button", { name: /Suivant/ }).click();
  }

  async uploadFile(filename: string, content: string | Buffer): Promise<void> {
    await this.page.getByLabel("Choisir un fichier").setInputFiles({
      name: filename,
      mimeType: filename.endsWith(".xlsx") ? XLSX_MIME_TYPE : "text/csv",
      buffer: Buffer.from(content),
    });
  }

  async verifyFile(utilisateurEmail: string): Promise<void> {
    const verification = this.page.waitForResponse(/\/verifier/);
    await this.page
      .getByRole("button", { name: /Vérifier le fichier/ })
      .click();
    const rapport = (await (await verification).json()) as {
      id: string;
      estValide: boolean;
      listeErreursValidation: { message: string }[];
    };
    // Pour un fichier invalide, l'identifiant renvoyé n'est pas celui du rapport
    // enregistré : on le retrouve par ses erreurs.
    this.e2eContext.track(
      "RAPPORT_IMPORT_CREE",
      rapport.estValide
        ? { id: rapport.id }
        : {
            utilisateurEmail,
            est_valide: false,
            erreur_validation_fichier: {
              some: { message: rapport.listeErreursValidation[0].message },
            },
          },
    );
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
    ).toBeVisible({ timeout: 30_000 });
  }

  async expectFileInvalid(): Promise<void> {
    await expect(
      this.page.getByText(/Le fichier ne peut pas être importé/),
    ).toBeVisible({ timeout: 30_000 });
  }

  async expectImportSuccess(indicateurId: string): Promise<void> {
    await expect(
      this.page.getByText(
        `Les données ont été importées avec succès pour l'indicateur ${indicateurId}`,
      ),
    ).toBeVisible({ timeout: 30_000 });
  }
}
