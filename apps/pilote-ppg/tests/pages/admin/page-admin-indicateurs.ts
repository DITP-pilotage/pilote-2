import { Page, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { HeaderComponent } from "../../components/header.component";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminIndicateurs extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
    this.header = new HeaderComponent(page);
  }

  private get table() {
    return this.page.locator("table", {
      has: this.page.locator("caption", {
        hasText: "Tableau des indicateurs",
      }),
    });
  }

  private get indicateursCountHeading() {
    return this.page
      .getByRole("heading", { level: 2 })
      .filter({ hasText: /\d{1,10} indicateurs?/ });
  }

  private get searchBox() {
    return this.page.getByRole("search").locator("input[type='search']");
  }

  private get createIndicateurButton() {
    return this.page.getByRole("button", { name: /Créer un indicateur/ });
  }

  private get exportButton() {
    return this.page.getByRole("button", { name: /Exporter/ });
  }

  private get resetFiltersButton() {
    return this.page.getByRole("button", {
      name: /Réinitialiser les filtres/,
    });
  }

  private get territorialiseToggle() {
    return this.page.getByRole("switch", {
      name: /Indicateurs territorialisés/,
    });
  }

  private get barometreToggle() {
    return this.page.getByRole("switch", {
      name: /Indicateurs du baromètre/,
    });
  }

  private get pagination() {
    return this.page.getByRole("navigation", { name: "Pagination" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/panel-administrateur/indicateurs");
    await this.page
      .getByRole("heading", {
        name: /Gestion des paramètres des indicateurs/,
      })
      .waitFor({ state: "visible" });
  }

  // Une saisie avant l'hydratation est effacée au rendu (WebKit) : on la rejoue jusqu'à ce qu'elle tienne.
  async searchIndicateur(text: string): Promise<void> {
    await expect(async () => {
      await this.searchBox.fill(text);
      await expect(this.searchBox).toHaveValue(text, { timeout: 1_000 });
    }).toPass();
  }

  async clearSearch(): Promise<void> {
    await this.searchBox.clear();
    await expect(this.searchBox).toHaveValue("");
  }

  async filterByTerritorialise(): Promise<void> {
    await this.waitForListingReload(() => this.territorialiseToggle.click());
    await expect(this.territorialiseToggle).toBeChecked();
  }

  async filterByBarometre(): Promise<void> {
    await this.waitForListingReload(() => this.barometreToggle.click());
    await expect(this.barometreToggle).toBeChecked();
  }

  async resetFilters(): Promise<void> {
    await this.waitForListingReload(() => this.resetFiltersButton.click());
    await expect(this.territorialiseToggle).not.toBeChecked();
    await expect(this.barometreToggle).not.toBeChecked();
  }

  /**
   * Le listing est filtré côté serveur : le compteur et le tableau ne sont à jour
   * qu'une fois la réponse tRPC reçue, pas dès que le filtre est coché.
   */
  private async waitForListingReload(
    action: () => Promise<void>,
  ): Promise<void> {
    const listingReload = this.page.waitForResponse((response) =>
      decodeURIComponent(response.url()).includes(
        "listerMetadataIndicateurFiltres",
      ),
    );
    await action();
    await listingReload;
  }

  async goToNextPage(): Promise<void> {
    await this.pagination
      .getByRole("button", { name: "Page suivante" })
      .click();
  }

  async goToPage(pageNumber: number): Promise<void> {
    await this.pagination
      .getByRole("button", { name: `${pageNumber}` })
      .click();
  }

  async clickIndicateurById(indicateurId: string): Promise<void> {
    await this.table
      .getByRole("row")
      .filter({ hasText: indicateurId })
      .getByRole("link")
      .first()
      .click();
    await this.page.waitForURL(
      `**/panel-administrateur/indicateurs/${indicateurId}`,
    );
  }

  async expectPageTitle(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: /Gestion des paramètres des indicateurs/,
      }),
    ).toBeVisible();
  }

  async expectColumnVisible(columnName: string): Promise<void> {
    await expect(
      this.table.getByRole("columnheader", { name: columnName }),
    ).toBeVisible();
  }

  async expectIndicateursCount(count: number): Promise<void> {
    const text = count <= 1 ? `${count} indicateur` : `${count} indicateurs`;
    await expect(this.indicateursCountHeading).toHaveText(text);
  }

  async expectIndicateursCountGreaterThan(minimum: number): Promise<void> {
    await expect(this.indicateursCountHeading).toBeVisible();
    const text = await this.indicateursCountHeading.textContent();
    const match = text?.match(/(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(minimum);
  }

  async expectIndicateurInTable(indicateurId: string): Promise<void> {
    await expect(
      this.table.getByRole("row").filter({ hasText: indicateurId }),
    ).toBeVisible();
  }

  async expectCreateIndicateurButtonVisible(): Promise<void> {
    await expect(this.createIndicateurButton).toBeVisible();
  }

  async expectExportButtonVisible(): Promise<void> {
    await expect(this.exportButton).toBeVisible();
  }

  async expectPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  async expectPaginationNotVisible(): Promise<void> {
    await expect(this.pagination).not.toBeVisible();
  }

  async expectTableRowCount(count: number): Promise<void> {
    await expect(this.table.locator("tbody tr")).toHaveCount(count);
  }

  async expectActiveFilterVisible(label: string): Promise<void> {
    await expect(this.page.getByRole("button", { name: label })).toBeVisible();
  }

  async getDisplayedIndicateursCount(): Promise<number> {
    const text = await this.indicateursCountHeading.textContent();
    const match = text?.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  private get indicateursDesChantiersLink() {
    return this.page.getByRole("link", { name: /Indicateurs des chantiers/ });
  }

  async expectIndicateursDesChantiersLinkNotVisible(): Promise<void> {
    await expect(this.indicateursDesChantiersLink).not.toBeVisible();
  }
}
