import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { HeaderComponent } from "../components/header.component";
import { PageChantier } from "./page-chantier";

export class PageAccueil extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async expectStructure(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: /\d+ chantiers/ })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: /Taux d'avancement moyen/ })).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /Taux d'avancement des chantiers par territoire/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /Répartition des météos renseignées/ }),
    ).toBeVisible();
  }

  async expectFilterTag(tagName: string): Promise<void> {
    await expect(
      this.page.locator(`button[aria-label='Retirer le tag ${tagName}']`),
    ).toBeVisible();
  }

  async filterByMinistere(ministereName: string): Promise<void> {
    await this.page.getByRole("button", { name: /Filtrer par ministères/ }).click();
    await this.page.getByRole("button", { name: ministereName }).click();
  }

  async selectChantier(chantierName: string, chantierId: string): Promise<PageChantier> {
    await this.page.getByRole("table").getByRole("cell", { name: chantierName }).click();
    await this.page.waitForURL(`**/chantier/CH-${chantierId}/NAT-FR**`);
    return new PageChantier(this.page);
  }

  async openExportModal(): Promise<void> {
    await this.page.getByRole("button", { name: /Exporter les données/ }).click();
  }
}
