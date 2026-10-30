import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminIndicateurForm extends BasePage {
  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
  }

  private get ficheHeading() {
    return this.page.getByRole("heading", { level: 1 });
  }

  private get editButton() {
    return this.page.getByRole("button", { name: "Modifier" }).first();
  }

  private get confirmChangesButton() {
    return this.page
      .getByRole("button", { name: "Confirmer les changements" })
      .first();
  }

  private get cancelButton() {
    return this.page.getByRole("button", { name: "Annuler" }).first();
  }

  private get createIndicateurButton() {
    return this.page
      .getByRole("button", { name: "Créer l'indicateur" })
      .first();
  }

  private get backLink() {
    return this.page.getByRole("link", { name: "Retour" });
  }

  private get summaryCard() {
    return this.page.locator(".rounded-lg.bg-blue-50").first();
  }

  private get identityAccordion() {
    return this.page.getByRole("button", { name: "Identité indicateur" });
  }

  private get settingsAccordion() {
    return this.page.getByRole("button", { name: "Paramétrages" });
  }

  private get otherInformationAccordion() {
    return this.page.getByRole("button", {
      name: "Autres informations",
    });
  }

  private get zoneGroupeSelect() {
    return this.page.locator('[id="zgApplicable"]');
  }

  async goto(indicateurId: string): Promise<void> {
    await this.page.goto(`/panel-administrateur/indicateurs/${indicateurId}`);
    await this.ficheHeading.waitFor({ state: "visible" });
  }

  async gotoCreation(indicateurId: string): Promise<void> {
    await this.page.goto(
      `/panel-administrateur/indicateurs/${indicateurId}?_action=creer-indicateur`,
    );
    await this.ficheHeading.waitFor({ state: "visible" });
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await expect(this.confirmChangesButton).toBeVisible();
  }

  async clickConfirmChanges(): Promise<void> {
    await this.confirmChangesButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickCreateIndicateur(): Promise<void> {
    await this.createIndicateurButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backLink.click();
    await this.page.waitForURL("**/panel-administrateur/indicateurs");
  }

  async openSettingsAccordion(): Promise<void> {
    await this.openAccordion(this.settingsAccordion);
  }

  async openOtherInformationAccordion(): Promise<void> {
    await this.openAccordion(this.otherInformationAccordion);
  }

  private async openAccordion(accordion: Locator): Promise<void> {
    if ((await accordion.getAttribute("aria-expanded")) === "false") {
      await accordion.click();
    }
    await expect(accordion).toHaveAttribute("aria-expanded", "true");
  }

  async expectFicheTitle(indicateurId: string): Promise<void> {
    await expect(this.ficheHeading).toContainText(
      `Fiche de l'indicateur ${indicateurId}`,
    );
  }

  async expectReadMode(): Promise<void> {
    await expect(this.editButton).toBeVisible();
    await expect(this.confirmChangesButton).not.toBeVisible();
    await expect(this.cancelButton).not.toBeVisible();
  }

  async expectEditMode(): Promise<void> {
    await expect(this.confirmChangesButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
    await expect(this.editButton).not.toBeVisible();
  }

  async expectZoneGroupeOptionVisible(name: string): Promise<void> {
    await this.zoneGroupeSelect.click();
    await expect(this.page.getByRole("option", { name: name })).toHaveCount(1);
    await this.page.keyboard.press("Escape");
  }

  async expectCreationMode(): Promise<void> {
    await expect(this.createIndicateurButton).toBeVisible();
    await expect(this.editButton).not.toBeVisible();
    await expect(this.confirmChangesButton).not.toBeVisible();
  }

  async expectUpdateSuccessAlert(): Promise<void> {
    await expect(
      this.page.getByText("Bravo, l'indicateur a bien été modifié !"),
    ).toBeVisible();
  }

  async expectCreationSuccessAlert(): Promise<void> {
    await expect(
      this.page.getByText("Bravo, l'indicateur a bien été crée !"),
    ).toBeVisible();
  }

  async expectSummaryCardVisible(): Promise<void> {
    await expect(this.summaryCard).toBeVisible();
  }

  async expectSummaryField(label: string): Promise<void> {
    await expect(this.summaryCard.getByText(label)).toBeVisible();
  }

  async expectIdentityAccordionOpen(): Promise<void> {
    await expect(this.identityAccordion).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }

  async expectSettingsAccordionClosed(): Promise<void> {
    await expect(this.settingsAccordion).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }

  async expectOtherInformationAccordionClosed(): Promise<void> {
    await expect(this.otherInformationAccordion).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }

  async expectSectionVisible(title: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }

  async expectBackLinkVisible(): Promise<void> {
    await expect(this.backLink).toBeVisible();
  }

  async expectActiveInactiveSelectorVisible(): Promise<void> {
    await expect(this.page.getByText("Actif", { exact: true })).toBeVisible();
    await expect(this.page.getByText("Inactif", { exact: true })).toBeVisible();
  }

  async expectValueDisplayed(text: string): Promise<void> {
    await expect(
      this.page.getByText(text, { exact: false }).first(),
    ).toBeVisible();
  }

  // --- Interactions avec les sélecteurs de paramétrage ---

  private selectByName(name: string) {
    return this.page.locator(`[id="${name}"]`);
  }

  async changeSelect(name: string, value: string): Promise<void> {
    await this.selectByName(name).click();
    await this.page
      .getByRole("option")
      .and(this.page.locator(`[data-value="${value}"]`))
      .click();
  }

  async expectSelectDisabled(name: string): Promise<void> {
    await expect(this.selectByName(name)).toBeDisabled();
  }

  async expectSelectEnabled(name: string): Promise<void> {
    await expect(this.selectByName(name)).toBeEnabled();
  }

  async expectSelectValue(name: string, value: string): Promise<void> {
    await expect(this.selectByName(name)).toHaveAttribute("data-value", value);
  }

  // --- Interactions avec les champs input de paramétrage ---

  private inputById(name: string) {
    return this.page.locator(`input#${name}`);
  }

  async expectInputDisabled(name: string): Promise<void> {
    await expect(this.inputById(name)).toBeDisabled();
  }

  async expectInputEnabled(name: string): Promise<void> {
    await expect(this.inputById(name)).toBeEnabled();
  }

  async expectInputValue(name: string, value: string): Promise<void> {
    await expect(this.inputById(name)).toHaveValue(value);
  }

  async fillInput(name: string, value: string): Promise<void> {
    await this.inputById(name).fill(value);
  }

  // --- Interactions avec les textareas ---

  private textareaById(name: string) {
    return this.page.locator(`textarea#${name}`);
  }

  async fillTextArea(name: string, value: string): Promise<void> {
    await this.textareaById(name).fill(value);
  }

  async expectTextAreaValue(name: string, value: string): Promise<void> {
    await expect(this.textareaById(name)).toHaveValue(value);
  }

  // --- Interaction avec les switches (Radix Switch) ---

  private switchByTitle(title: string) {
    return this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${title}$`) })
      .locator("..")
      .getByRole("switch");
  }

  async clickSwitch(title: string): Promise<void> {
    const switchElement = this.switchByTitle(title);
    await switchElement.scrollIntoViewIfNeeded();
    await switchElement.click();
  }
}
