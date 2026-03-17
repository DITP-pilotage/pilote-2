import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { PageChantier } from "./page-chantier";
import { HeaderComponent } from "../components/header.component";
import { ExportCsvModal } from "../components/export-csv.modal";
import { E2ETestContext } from "../e2e-test-context";

export class PageAccueil extends BasePage {
  readonly header: HeaderComponent;

  readonly exportModal: ExportCsvModal;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
    this.header = new HeaderComponent(page);
    this.exportModal = new ExportCsvModal(page);
  }

  async expectStructure(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /\d+ chantiers/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /Taux d'avancement moyen/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /Taux d'avancement des chantiers par territoire/,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /Répartition des météos renseignées/,
      }),
    ).toBeVisible();
  }

  async expectFilterTag(tagName: string): Promise<void> {
    await expect(
      this.page.locator(`button[aria-label='Retirer le tag ${tagName}']`),
    ).toBeVisible();
  }

  async filterByMinistere(ministereName: string): Promise<void> {
    await this.page
      .getByRole("button", { name: /Filtrer par ministères/ })
      .click();
    await this.page.getByRole("button", { name: ministereName }).click();
  }

  async selectChantier(chantierName: string): Promise<PageChantier> {
    await this.page.waitForLoadState("networkidle");
    await this.page
      .getByRole("table")
      .getByRole("cell", { name: chantierName })
      .click();
    await this.page.waitForURL("**/chantier/**");
    await expect(
      this.page.getByRole("heading", { name: /Avancement du chantier/ }),
    ).toBeVisible({ timeout: 30_000 });
    return new PageChantier(this.page, this.e2eContext);
  }

  async openExportModal(): Promise<void> {
    await this.page
      .getByRole("button", { name: /Exporter les données/ })
      .click();
  }
}
