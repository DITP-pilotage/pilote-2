import { Page, Download, expect } from "@playwright/test";

type ExportType = "chantiers" | "indicateurs" | "historique-indicateurs";

export class ExportCsvModal {
  constructor(private readonly page: Page) {}

  private get form() {
    return this.page.getByTestId("form-export");
  }

  async expectStep(step: number, title: string | RegExp): Promise<void> {
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: new RegExp(`Exporter les données - Étape ${step} sur 5`),
      }),
    ).toBeVisible();
  }

  async selectExportType(type: ExportType): Promise<void> {
    const labels = {
      chantiers: /les chantiers/,
      indicateurs: /les indicateurs des chantiers/,
      "historique-indicateurs": /l'historique des indicateurs/,
    };
    await this.page.getByLabel(labels[type]).check({ force: true });
  }

  async selectPerimeter(withFilters: boolean): Promise<void> {
    if (withFilters) {
      await this.page
        .getByLabel(
          /exporter les éléments de la sélection présentement active dans PILOTE/,
        )
        .check({ force: true });
    } else {
      await this.page.getByLabel(/exporter tous les éléments/).check();
    }
  }

  async checkDataOption(label: string | RegExp): Promise<void> {
    await this.page
      .getByRole("checkbox", { name: label })
      .setChecked(true, { force: true });
  }

  async nextStep(): Promise<void> {
    await this.page.getByRole("button", { name: /Étape suivante/ }).click();
  }

  async download(timeout = 120_000): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download", { timeout });
    await this.form
      .getByRole("button", { name: /Exporter les données/ })
      .click();
    return downloadPromise;
  }
}
