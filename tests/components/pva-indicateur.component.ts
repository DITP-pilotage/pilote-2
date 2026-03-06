import { Locator, Page, expect } from "@playwright/test";
import { PvaModalComponent } from "./pva-modal.component";

export class PvaIndicateurComponent {
  private readonly section: Locator;

  constructor(
    private readonly page: Page,
    indicateurId: string,
  ) {
    this.section = page.locator(
      `xpath=//strong[text()="${indicateurId}"]/ancestor::section[1]`,
    );
  }

  // --- Actions ---

  async supprimerPropositionSiExistante(): Promise<void> {
    const boutonSupprimer = this.section.getByRole("button", {
      name: /Supprimer la proposition/,
    });
    if (
      await boutonSupprimer.isVisible({ timeout: 2_000 }).catch(() => false)
    ) {
      await boutonSupprimer.click();
      const modal = new PvaModalComponent(this.page);
      await modal.remplirMotifSuppression("Nettoyage avant test e2e");
      await modal.confirmerSuppression();
      await modal.expectConfirmationEtFermer(/supprimée/);
    }
  }

  async clickProposerAutreValeur(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", {
        name: /Proposer une autre valeur d'avancement/,
      })
      .click();
    return new PvaModalComponent(this.page);
  }

  async afficherProposition(): Promise<void> {
    await this.section
      .getByRole("button", { name: /Afficher la proposition/ })
      .click();
  }

  async clickModifierProposition(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Modifier la proposition/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickSupprimerProposition(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Supprimer la proposition/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickAccuserReception(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Accuser réception/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickPrendreDecision(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Prendre une décision/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickVoirHistorique(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Voir l'historique/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  // --- Assertions ---

  async expectStatut(statut: string | RegExp): Promise<void> {
    await expect(this.section.getByText(statut)).toBeVisible();
  }

  async expectProposerAutreValeurVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Proposer une autre valeur d'avancement/,
      }),
    ).toBeVisible();
  }

  async expectProposerAutreValeurNotVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Proposer une autre valeur d'avancement/,
      }),
    ).not.toBeVisible();
  }

  async expectModifierVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Modifier la proposition/,
      }),
    ).toBeVisible();
  }

  async expectModifierNotVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Modifier la proposition/,
      }),
    ).not.toBeVisible();
  }

  async expectSupprimerVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Supprimer la proposition/,
      }),
    ).toBeVisible();
  }

  async expectSupprimerNotVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Supprimer la proposition/,
      }),
    ).not.toBeVisible();
  }

  async expectBlocageMaille(): Promise<void> {
    await expect(
      this.section.getByText(
        /Impossible de proposer une autre valeur d'avancement/,
      ),
    ).toBeVisible();
  }
}
