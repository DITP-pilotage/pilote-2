import { Page, Download } from "@playwright/test";
import { BasePage } from "../base.page";
import { HeaderComponent } from "../../components/header.component";

export class PageAdminUtilisateurs extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.getByRole("link", { name: /Gestion des comptes/ }).click();
    await this.page.waitForURL("**/admin/utilisateurs");
  }

  async exportCsv(timeout = 120_000): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download", { timeout });
    await this.page
      .getByTestId("form-export")
      .getByRole("button", { name: /Exporter les données/ })
      .click();
    return downloadPromise;
  }
}
