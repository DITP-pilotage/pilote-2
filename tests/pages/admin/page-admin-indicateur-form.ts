import { Page, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminIndicateurForm extends BasePage {
  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
  }

  private get titreFiche() {
    return this.page.getByRole("heading", { level: 1 });
  }

  private get boutonModifier() {
    return this.page.getByRole("button", { name: "Modifier" }).first();
  }

  private get boutonConfirmerChangements() {
    return this.page
      .getByRole("button", { name: "Confirmer les changements" })
      .first();
  }

  private get boutonAnnuler() {
    return this.page.getByRole("button", { name: "Annuler" }).first();
  }

  private get boutonCreerIndicateur() {
    return this.page
      .getByRole("button", { name: "Créer l'indicateur" })
      .first();
  }

  private get lienRetour() {
    return this.page.getByRole("link", { name: "Retour" });
  }

  private get carteRecapitulative() {
    return this.page.locator(".rounded-lg.bg-blue-50").first();
  }

  private get accordionIdentite() {
    return this.page.getByRole("button", { name: "Identité indicateur" });
  }

  private get accordionParametrages() {
    return this.page.getByRole("button", { name: "Paramétrages" });
  }

  private get accordionAutresInformations() {
    return this.page.getByRole("button", {
      name: "Autres informations",
    });
  }

  async goto(indicateurId: string): Promise<void> {
    await this.page.goto(`/panel-administrateur/indicateurs/${indicateurId}`);
    await this.titreFiche.waitFor({ state: "visible" });
  }

  async gotoCreation(indicateurId: string): Promise<void> {
    await this.page.goto(
      `/panel-administrateur/indicateurs/${indicateurId}?_action=creer-indicateur`,
    );
    await this.titreFiche.waitFor({ state: "visible" });
  }

  async clickModifier(): Promise<void> {
    await this.boutonModifier.click();
  }

  async clickConfirmerChangements(): Promise<void> {
    await this.boutonConfirmerChangements.click();
  }

  async clickAnnuler(): Promise<void> {
    await this.boutonAnnuler.click();
  }

  async clickCreerIndicateur(): Promise<void> {
    await this.boutonCreerIndicateur.click();
  }

  async clickRetour(): Promise<void> {
    await this.lienRetour.click();
    await this.page.waitForURL("**/panel-administrateur/indicateurs");
  }

  async ouvrirAccordionParametrages(): Promise<void> {
    const isExpanded =
      await this.accordionParametrages.getAttribute("aria-expanded");
    if (isExpanded === "false") {
      await this.accordionParametrages.click();
    }
  }

  async ouvrirAccordionAutresInformations(): Promise<void> {
    const isExpanded =
      await this.accordionAutresInformations.getAttribute("aria-expanded");
    if (isExpanded === "false") {
      await this.accordionAutresInformations.click();
    }
  }

  async remplirChampTexte(label: string, valeur: string): Promise<void> {
    const champ = this.page.getByLabel(label, { exact: false });
    await champ.fill(valeur);
  }

  async expectTitreFiche(indicateurId: string): Promise<void> {
    await expect(this.titreFiche).toContainText(
      `Fiche de l'indicateur ${indicateurId}`,
    );
  }

  async expectModeConsultation(): Promise<void> {
    await expect(this.boutonModifier).toBeVisible();
    await expect(this.boutonConfirmerChangements).not.toBeVisible();
    await expect(this.boutonAnnuler).not.toBeVisible();
  }

  async expectModeModification(): Promise<void> {
    await expect(this.boutonConfirmerChangements).toBeVisible();
    await expect(this.boutonAnnuler).toBeVisible();
    await expect(this.boutonModifier).not.toBeVisible();
  }

  async expectModeCreation(): Promise<void> {
    await expect(this.boutonCreerIndicateur).toBeVisible();
    await expect(this.boutonModifier).not.toBeVisible();
    await expect(this.boutonConfirmerChangements).not.toBeVisible();
  }

  async expectAlerteSuccesModification(): Promise<void> {
    await expect(
      this.page.getByText("Bravo, l'indicateur a bien été modifié !"),
    ).toBeVisible();
  }

  async expectAlerteSuccesCreation(): Promise<void> {
    await expect(
      this.page.getByText("Bravo, l'indicateur a bien été crée !"),
    ).toBeVisible();
  }

  async expectCarteRecapitulativeVisible(): Promise<void> {
    await expect(this.carteRecapitulative).toBeVisible();
  }

  async expectChampRecapitulatif(label: string): Promise<void> {
    await expect(this.carteRecapitulative.getByText(label)).toBeVisible();
  }

  async expectAccordionIdentiteOuvert(): Promise<void> {
    await expect(this.accordionIdentite).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }

  async expectAccordionParametragesFerme(): Promise<void> {
    await expect(this.accordionParametrages).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }

  async expectAccordionAutresInformationsFerme(): Promise<void> {
    await expect(this.accordionAutresInformations).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }

  async expectSectionVisible(titre: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: titre, exact: true }),
    ).toBeVisible();
  }

  async expectLienRetourVisible(): Promise<void> {
    await expect(this.lienRetour).toBeVisible();
  }

  async expectSelecteurActifInactifVisible(): Promise<void> {
    await expect(this.page.getByText("Actif", { exact: true })).toBeVisible();
    await expect(this.page.getByText("Inactif", { exact: true })).toBeVisible();
  }

  async expectDonneeAffichee(texte: string): Promise<void> {
    await expect(
      this.page.getByText(texte, { exact: false }).first(),
    ).toBeVisible();
  }

  // --- Interactions avec les sélecteurs de paramétrage ---

  private selectByName(name: string) {
    return this.page.locator(`select[name="${name}"]`);
  }

  async changerSelecteur(name: string, valeur: string): Promise<void> {
    await this.selectByName(name).selectOption(valeur);
  }

  async expectSelecteurDesactive(name: string): Promise<void> {
    await expect(this.selectByName(name)).toBeDisabled();
  }

  async expectSelecteurActive(name: string): Promise<void> {
    await expect(this.selectByName(name)).toBeEnabled();
  }

  async expectSelecteurValeur(name: string, valeur: string): Promise<void> {
    await expect(this.selectByName(name)).toHaveValue(valeur);
  }

  // --- Interactions avec les champs input de paramétrage ---

  private inputById(name: string) {
    return this.page.locator(`input#${name}`);
  }

  async expectInputDesactive(name: string): Promise<void> {
    await expect(this.inputById(name)).toBeDisabled();
  }

  async expectInputActive(name: string): Promise<void> {
    await expect(this.inputById(name)).toBeEnabled();
  }

  // --- Interaction avec les switches (Radix Switch) ---

  private switchParTitre(titre: string) {
    return this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${titre}$`) })
      .locator("..")
      .getByRole("switch");
  }

  async clickSwitch(titre: string): Promise<void> {
    await this.switchParTitre(titre).click();
  }
}
