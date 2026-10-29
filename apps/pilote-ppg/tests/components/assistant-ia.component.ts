import { Page, expect } from "@playwright/test";

const NOM_ASSISTANT = "Assistant IA PILOTE";

export class AssistantIAComponent {
  constructor(private readonly page: Page) {}

  get lanceur() {
    return this.page.getByRole("button", {
      name: new RegExp(`Demander à l'${NOM_ASSISTANT}`),
    });
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

  private get selecteurVue() {
    return this.page.getByRole("group", { name: "Affichage de l'assistant" });
  }

  private get saisie() {
    return this.page.getByPlaceholder(/^Posez /);
  }

  async ouvrir(): Promise<void> {
    await this.lanceur.click();
  }

  async choisirVue(
    libelle: "Fenêtre flottante" | "Panneau latéral" | "Plein écran",
  ): Promise<void> {
    await this.selecteurVue.getByRole("button", { name: libelle }).click();
  }

  async saisir(texte: string): Promise<void> {
    await this.saisie.fill(texte);
  }

  async fermer(): Promise<void> {
    await this.page
      .getByRole("button", { name: `Fermer l'${NOM_ASSISTANT}` })
      .click();
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

  async expectSelecteurVue(): Promise<void> {
    await expect(this.selecteurVue).toBeVisible();
  }

  async expectSansSelecteurVue(): Promise<void> {
    await expect(this.selecteurVue).toHaveCount(0);
  }

  async expectSaisie(texte: string): Promise<void> {
    await expect(this.saisie).toHaveValue(texte);
  }

  async expectFerme(): Promise<void> {
    await expect(this.lanceur).toBeVisible();
  }
}
