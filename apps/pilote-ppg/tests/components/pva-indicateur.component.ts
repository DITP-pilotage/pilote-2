import { Locator, Page, expect } from "@playwright/test";
import { PvaModalComponent } from "./pva-modal.component";
import { E2ETestContext } from "../e2e-test-context";

export class PvaIndicateurComponent {
  private readonly section: Locator;

  constructor(
    private readonly page: Page,
    private readonly indicateurId: string,
    private readonly territoireCode: string,
    private readonly e2eContext: E2ETestContext,
  ) {
    this.section = page.locator(
      `xpath=//strong[text()="${indicateurId}"]/ancestor::section[1]`,
    );
  }

  private trackPva(): void {
    this.e2eContext.track("PROPOSITION_VALEUR_EVENEMENT_CREATED", {
      indic_id: this.indicateurId,
      territoire_code: this.territoireCode,
    });
  }

  // --- Actions---

  async clickProposeAnotherValeur(): Promise<PvaModalComponent> {
    this.trackPva();
    await this.section
      .getByRole("button", {
        name: /Proposer une autre valeur d'avancement/,
      })
      .click();
    return new PvaModalComponent(this.page);
  }

  async showProposition(): Promise<void> {
    await this.section
      .getByRole("button", { name: /Afficher la proposition/ })
      .click();
  }

  async clickEditProposition(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Modifier la proposition/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickDeleteProposition(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Supprimer la proposition/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickAccuseReception(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Accuser réception/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickMakeDecision(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Prendre une décision/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  async clickShowHistorique(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Voir l'historique/ })
      .click();
    return new PvaModalComponent(this.page);
  }

  // --- Assertions ---

  async expectStatut(statut: string | RegExp): Promise<void> {
    await expect(this.section.getByText(statut)).toBeVisible();
  }

  async expectProposeAnotherValeurVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Proposer une autre valeur d'avancement/,
      }),
    ).toBeVisible();
  }

  async expectProposeAnotherValeurNotVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Proposer une autre valeur d'avancement/,
      }),
    ).not.toBeVisible();
  }

  async expectEditVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Modifier la proposition/,
      }),
    ).toBeVisible();
  }

  async expectEditNotVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Modifier la proposition/,
      }),
    ).not.toBeVisible();
  }

  async expectDeleteVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Supprimer la proposition/,
      }),
    ).toBeVisible();
  }

  async expectDeleteNotVisible(): Promise<void> {
    await expect(
      this.section.getByRole("button", {
        name: /Supprimer la proposition/,
      }),
    ).not.toBeVisible();
  }

  async expectMailleBlocked(): Promise<void> {
    await expect(
      this.section.getByText(
        /Impossible de proposer une autre valeur d'avancement/,
      ),
    ).toBeVisible();
  }
}
