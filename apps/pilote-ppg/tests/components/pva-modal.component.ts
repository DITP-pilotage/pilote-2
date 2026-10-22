import { Page, expect } from "@playwright/test";

type DecisionType = "accepter" | "refuser" | "accepter-avec-modification";

export class PvaModalComponent {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole("dialog");
  }

  // --- Actions communes ---

  async goToNextStep(): Promise<void> {
    await this.dialog.getByRole("button", { name: /Étape suivante/ }).click();
  }

  async close(): Promise<void> {
    await this.page.getByTitle("Fermer la fenêtre modale").click();
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async expectConfirmationAndClose(confirmationMessage: RegExp): Promise<void> {
    await expect(this.dialog.getByText(confirmationMessage)).toBeVisible({
      timeout: 15_000,
    });
    await this.close();
  }

  async expectContains(text: string | RegExp): Promise<void> {
    await expect(this.dialog.getByText(text)).toBeVisible();
  }

  async expectHeading(name: string): Promise<void> {
    await expect(
      this.dialog.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }

  // --- Proposition (création / modification) ---

  async fillProposition(
    value: string,
    motif: string,
    source: string,
  ): Promise<void> {
    await this.dialog.locator('input[name="valeurAvancement"]').fill(value);
    await this.dialog.locator('textarea[name="motifProposition"]').fill(motif);
    await this.dialog
      .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
      .fill(source);
  }

  async publishProposition(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Publier la proposition/ })
      .click();
  }

  // --- Accusé de réception ---

  async fillMotif(motif: string): Promise<void> {
    await this.dialog.locator('textarea[name="motif"]').fill(motif);
  }

  async confirmAccuseReception(): Promise<void> {
    await this.dialog
      .getByRole("button", {
        name: /Confirmer l'envoi de l'accusé de réception/,
      })
      .click();
  }

  // --- Décision ---

  async selectDecision(decision: DecisionType): Promise<void> {
    const labels: Record<DecisionType, RegExp> = {
      accepter: /accepter la proposition$/,
      refuser: /refuser la proposition/,
      "accepter-avec-modification": /accepter la proposition avec modification/,
    };
    await this.dialog.getByLabel(labels[decision]).check({ force: true });
  }

  async fillUpdatedValeur(value: string): Promise<void> {
    await this.dialog.locator('input[name="valeurModification"]').fill(value);
  }

  async acceptProposition(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Accepter la proposition/ })
      .click();
  }

  async validateDecision(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Valider la décision/ })
      .click();
  }

  async acceptWithModification(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Accepter avec modification/ })
      .click();
  }

  // --- Suppression ---

  async fillDeletionMotif(motif: string): Promise<void> {
    await this.dialog.locator('textarea[name="motifSuppression"]').fill(motif);
  }

  async confirmDeletion(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Supprimer la proposition/ })
      .click();
  }
}
