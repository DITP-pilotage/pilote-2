import { Page, expect } from "@playwright/test";

const NOM_ASSISTANT = "Assistant IA PILOTE";

type View = "Panneau latéral" | "Fenêtre flottante" | "Plein écran";

export class AssistantIAComponent {
  constructor(private readonly page: Page) {}

  get launcher() {
    return this.page.getByRole("button", { name: /Demander à l'assistant/ });
  }

  private get modal() {
    return this.page.getByRole("dialog", { name: NOM_ASSISTANT });
  }

  private get panel() {
    return this.page.getByRole("complementary", { name: NOM_ASSISTANT });
  }

  private get floatingWindow() {
    return this.page.getByRole("region", { name: NOM_ASSISTANT });
  }

  private get viewButton() {
    return this.page.getByRole("button", { name: /^Affichage/ });
  }

  private get panelHandle() {
    return this.page.getByRole("separator", {
      name: "Largeur du panneau de l'assistant",
    });
  }

  private get input() {
    return this.page.getByPlaceholder(/^Posez /);
  }

  async open(): Promise<void> {
    await this.launcher.click();
  }

  async hide(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Masquer l'assistant" })
      .click();
  }

  async chooseView(view: View): Promise<void> {
    await this.viewButton.click();
    await this.page.getByRole("menuitemradio", { name: view }).click();
  }

  async startNewConversation(): Promise<void> {
    await this.page.getByTitle("Nouvelle conversation").click();
  }

  async openHistory(): Promise<void> {
    await this.page.getByTitle("Historique des conversations").click();
  }

  async widenPanelWithKeyboard(): Promise<void> {
    await this.panelHandle.focus();
    await this.page.keyboard.press("ArrowLeft");
  }

  async fillInput(text: string): Promise<void> {
    await this.input.fill(text);
  }

  async expectModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async expectPanel(): Promise<void> {
    await expect(this.panel).toBeVisible();
    await expect(this.modal).toHaveCount(0);
  }

  async expectFloatingWindow(): Promise<void> {
    await expect(this.floatingWindow).toBeVisible();
    await expect(this.panel).toHaveCount(0);
  }

  async expectPanelWidth(width: number): Promise<void> {
    await expect(this.panelHandle).toHaveAttribute(
      "aria-valuenow",
      String(width),
    );
  }

  async expectHistory(): Promise<void> {
    await expect(
      this.page.getByRole("dialog", { name: "Historique des conversations" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("searchbox", {
        name: "Rechercher une conversation",
      }),
    ).toBeVisible();
  }

  async expectViewSelector(): Promise<void> {
    await expect(this.viewButton).toBeVisible();
  }

  async expectNoViewSelector(): Promise<void> {
    await expect(this.viewButton).toHaveCount(0);
  }

  async expectInput(text: string): Promise<void> {
    await expect(this.input).toHaveValue(text);
  }

  async expectClosed(): Promise<void> {
    await expect(this.launcher).toBeVisible();
  }
}
