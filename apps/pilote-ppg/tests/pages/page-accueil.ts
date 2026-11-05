import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { PageChantier } from "./page-chantier";
import { HeaderComponent } from "../components/header.component";
import { ExportCsvModal } from "../components/export-csv.modal";
import { AssistantIAComponent } from "../components/assistant-ia.component";
import { E2ETestContext } from "../e2e-test-context";

export class PageAccueil extends BasePage {
  readonly header: HeaderComponent;

  readonly exportModal: ExportCsvModal;

  readonly assistantIA: AssistantIAComponent;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
    this.header = new HeaderComponent(page);
    this.exportModal = new ExportCsvModal(page);
    this.assistantIA = new AssistantIAComponent(page);
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
    await this.page.waitForURL(/perimetres=/);
  }

  async selectChantier(chantierName: string): Promise<PageChantier> {
    await this.page
      .getByRole("table")
      .getByRole("link", { name: chantierName })
      .click();
    await this.page.waitForURL("**/chantier/**");
    await expect(
      this.page.getByRole("heading", { name: /Avancement du chantier/ }),
    ).toBeVisible({ timeout: 30_000 });
    return new PageChantier(this.page, this.e2eContext);
  }

  async expectAssistantIAAccess(): Promise<void> {
    await expect(this.assistantIA.launcher).toBeVisible();
  }

  async expectNoAssistantIAAccess(): Promise<void> {
    // Le lanceur dépend d'une requête client : sans l'attendre, son absence ne prouve rien.
    const accessLoaded = this.page.waitForResponse(/albertAccess\.monAcces/);
    await this.page.reload();
    await accessLoaded;
    await expect(
      this.page.getByRole("heading", { name: /\d{1,10} chantiers/ }),
    ).toBeVisible();
    await expect(this.assistantIA.launcher).toHaveCount(0);
  }

  async openExportModal(): Promise<void> {
    await this.page
      .getByRole("button", { name: /Exporter les données/ })
      .click();
  }
}
