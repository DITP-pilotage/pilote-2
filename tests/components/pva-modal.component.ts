import { Page, expect } from "@playwright/test";

type DecisionType = "accepter" | "refuser" | "accepter-avec-modification";

export class PvaModalComponent {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole("dialog");
  }

  // --- Actions communes ---

  async passerEtapeSuivante(): Promise<void> {
    await this.dialog.getByRole("button", { name: /Étape suivante/ }).click();
  }

  async fermer(): Promise<void> {
    await this.page.getByTitle("Fermer la fenêtre modale").click();
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async expectConfirmationEtFermer(messageConfirmation: RegExp): Promise<void> {
    await expect(this.dialog.getByText(messageConfirmation)).toBeVisible({
      timeout: 15_000,
    });
    await this.fermer();
  }

  async expectContient(text: string | RegExp): Promise<void> {
    await expect(this.dialog.getByText(text)).toBeVisible();
  }

  async expectHeading(name: string): Promise<void> {
    await expect(
      this.dialog.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }

  // --- Proposition (création / modification) ---

  async remplirProposition(
    valeur: string,
    motif: string,
    source: string,
  ): Promise<void> {
    await this.dialog.locator('input[name="valeurAvancement"]').fill(valeur);
    await this.dialog.locator('textarea[name="motifProposition"]').fill(motif);
    await this.dialog
      .locator('textarea[name="sourceDonneeEtMethodeCalcul"]')
      .fill(source);
  }

  async publierProposition(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Publier la proposition/ })
      .click();
  }

  // --- Accusé de réception ---

  async remplirMotif(motif: string): Promise<void> {
    await this.dialog.locator('textarea[name="motif"]').fill(motif);
  }

  async confirmerAccuseReception(): Promise<void> {
    await this.dialog
      .getByRole("button", {
        name: /Confirmer l'envoi de l'accusé de réception/,
      })
      .click();
  }

  // --- Décision ---

  async selectionnerDecision(decision: DecisionType): Promise<void> {
    const labels: Record<DecisionType, RegExp> = {
      accepter: /accepter la proposition$/,
      refuser: /refuser la proposition/,
      "accepter-avec-modification": /accepter la proposition avec modification/,
    };
    await this.dialog.getByLabel(labels[decision]).check({ force: true });
  }

  async remplirValeurModification(valeur: string): Promise<void> {
    await this.dialog.locator('input[name="valeurModification"]').fill(valeur);
  }

  async accepterProposition(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Accepter la proposition/ })
      .click();
  }

  async validerDecision(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Valider la décision/ })
      .click();
  }

  async accepterAvecModification(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Accepter avec modification/ })
      .click();
  }

  // --- Suppression ---

  async remplirMotifSuppression(motif: string): Promise<void> {
    await this.dialog.locator('textarea[name="motifSuppression"]').fill(motif);
  }

  async confirmerSuppression(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /Supprimer la proposition/ })
      .click();
  }
}
