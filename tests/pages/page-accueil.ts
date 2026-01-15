import { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { HeaderComponent } from "../components/header.component";

export class PageAccueil extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async filterByMinistere(ministereName: string): Promise<void> {
    await this.page.getByRole("button", { name: /Filtrer par ministères/ }).click();
    await this.page.getByRole("button", { name: ministereName }).click();
  }

  async selectChantier(chantierName: string): Promise<void> {
    await this.page.getByRole("table").getByRole("cell", { name: chantierName }).click();
  }

  async openExportModal(): Promise<void> {
    await this.page.getByRole("button", { name: /Exporter les données/ }).click();
  }
}
