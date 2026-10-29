import { Page, expect } from "@playwright/test";

const NOM_ASSISTANT = "Assistant IA PILOTE";

type Vue = "Panneau latéral" | "Fenêtre flottante" | "Plein écran";

export class AssistantIAComponent {
  constructor(private readonly page: Page) {}

  get lanceur() {
    return this.page.getByRole("button", { name: /Demander à l'assistant/ });
  }

  private get reprendre() {
    return this.page.getByRole("button", { name: /^Reprendre/ });
  }

  private get modale() {
    return this.page.getByRole("dialog", { name: NOM_ASSISTANT });
  }

  private get panneau() {
    return this.page.getByRole("complementary", { name: NOM_ASSISTANT });
  }

  private get fenetre() {
    return this.page.getByRole("region", { name: NOM_ASSISTANT });
  }

  private get boutonVue() {
    return this.page.getByRole("button", { name: /^Affichage/ });
  }

  private get poigneePanneau() {
    return this.page.getByRole("separator", {
      name: "Largeur du panneau de l'assistant",
    });
  }

  private get saisie() {
    return this.page.getByPlaceholder(/^Posez /);
  }

  async ouvrir(): Promise<void> {
    await this.lanceur.click();
  }

  async masquer(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Masquer l'assistant" })
      .click();
  }

  async reprendreLaConversation(): Promise<void> {
    await this.reprendre.click();
  }

  async choisirVue(vue: Vue): Promise<void> {
    await this.boutonVue.click();
    await this.page.getByRole("menuitemradio", { name: vue }).click();
  }

  async nouvelleConversation(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Nouvelle conversation" })
      .click();
  }

  async ouvrirHistorique(): Promise<void> {
    await this.page.getByTitle("Historique des conversations").click();
  }

  async elargirPanneauAuClavier(): Promise<void> {
    await this.poigneePanneau.focus();
    await this.page.keyboard.press("ArrowLeft");
  }

  async saisir(texte: string): Promise<void> {
    await this.saisie.fill(texte);
  }

  async expectModale(): Promise<void> {
    await expect(this.modale).toBeVisible();
  }

  async expectPanneau(): Promise<void> {
    await expect(this.panneau).toBeVisible();
    await expect(this.modale).toHaveCount(0);
  }

  async expectFenetre(): Promise<void> {
    await expect(this.fenetre).toBeVisible();
    await expect(this.panneau).toHaveCount(0);
  }

  async expectLargeurPanneau(largeur: number): Promise<void> {
    await expect(this.poigneePanneau).toHaveAttribute(
      "aria-valuenow",
      String(largeur),
    );
  }

  async expectHistorique(): Promise<void> {
    await expect(
      this.page.getByRole("dialog", { name: "Historique des conversations" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("searchbox", {
        name: "Rechercher une conversation",
      }),
    ).toBeVisible();
  }

  async expectSelecteurVue(): Promise<void> {
    await expect(this.boutonVue).toBeVisible();
  }

  async expectSansSelecteurVue(): Promise<void> {
    await expect(this.boutonVue).toHaveCount(0);
  }

  async expectSaisie(texte: string): Promise<void> {
    await expect(this.saisie).toHaveValue(texte);
  }

  async expectFerme(): Promise<void> {
    await expect(this.lanceur).toBeVisible();
  }

  async expectMasquee(): Promise<void> {
    await expect(this.reprendre).toBeVisible();
  }
}
