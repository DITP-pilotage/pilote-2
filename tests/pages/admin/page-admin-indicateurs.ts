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

  private get tableau() {
    return this.page.locator("table", {
      has: this.page.locator("caption", {
        hasText: "Tableau des indicateurs",
      }),
    });
  }

  private get titreNombreIndicateurs() {
    return this.page
      .getByRole("heading", { level: 2 })
      .filter({ hasText: /\d+ indicateurs?/ });
  }

  private get barreRecherche() {
    return this.page.getByRole("search").locator("input[type='search']");
  }

  private get boutonCreerIndicateur() {
    return this.page.getByRole("button", { name: /Créer un indicateur/ });
  }

  private get boutonExporter() {
    return this.page.getByRole("button", { name: /Exporter/ });
  }

  private get boutonReinitialiserFiltres() {
    return this.page.getByRole("button", {
      name: /Réinitialiser les filtres/,
    });
  }

  private get toggleTerritorialise() {
    return this.page.getByRole("switch", {
      name: /Indicateurs territorialisés/,
    });
  }

  private get toggleBarometre() {
    return this.page.getByRole("switch", {
      name: /Indicateurs du baromètre/,
    });
  }

  private get pagination() {
    return this.page.getByRole("navigation", { name: "Pagination" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/indicateurs");
    await this.page
      .getByRole("heading", {
        name: /Gestion des paramètres des indicateurs/,
      })
      .waitFor({ state: "visible" });
  }

  async rechercherIndicateur(texte: string): Promise<void> {
    await this.barreRecherche.fill(texte);
    await this.page.waitForTimeout(600);
  }

  async effacerRecherche(): Promise<void> {
    await this.barreRecherche.clear();
    await this.page.waitForTimeout(600);
  }

  async filtrerParTerritorialise(): Promise<void> {
    await this.toggleTerritorialise.click();
    await this.page.waitForTimeout(600);
  }

  async filtrerParBarometre(): Promise<void> {
    await this.toggleBarometre.click();
    await this.page.waitForTimeout(600);
  }

  async reinitialiserFiltres(): Promise<void> {
    await this.boutonReinitialiserFiltres.click();
    await this.page.waitForTimeout(600);
  }

  async allerPageSuivante(): Promise<void> {
    await this.pagination
      .getByRole("button", { name: "Page suivante" })
      .click();
  }

  async allerPage(numero: number): Promise<void> {
    await this.pagination.getByRole("button", { name: `${numero}` }).click();
  }

  async clickIndicateurParId(indicateurId: string): Promise<void> {
    await this.tableau
      .getByRole("row")
      .filter({ hasText: indicateurId })
      .getByRole("link")
      .first()
      .click();
    await this.page.waitForURL(`**/admin/indicateurs/${indicateurId}`);
  }

  async expectTitrePage(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: /Gestion des paramètres des indicateurs/,
      }),
    ).toBeVisible();
  }

  async expectColonneVisible(nomColonne: string): Promise<void> {
    await expect(
      this.tableau.getByRole("columnheader", { name: nomColonne }),
    ).toBeVisible();
  }

  async expectNombreIndicateurs(nombre: number): Promise<void> {
    const texte =
      nombre <= 1 ? `${nombre} indicateur` : `${nombre} indicateurs`;
    await expect(this.titreNombreIndicateurs).toHaveText(texte);
  }

  async expectNombreIndicateursSuperieurA(minimum: number): Promise<void> {
    await expect(this.titreNombreIndicateurs).toBeVisible();
    const texte = await this.titreNombreIndicateurs.textContent();
    const match = texte?.match(/(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(minimum);
  }

  async expectIndicateurDansTableau(indicateurId: string): Promise<void> {
    await expect(
      this.tableau.getByRole("row").filter({ hasText: indicateurId }),
    ).toBeVisible();
  }

  async expectIndicateurAbsentDuTableau(indicateurId: string): Promise<void> {
    await expect(
      this.tableau.getByRole("row").filter({ hasText: indicateurId }),
    ).not.toBeVisible();
  }

  async expectBoutonCreerIndicateurVisible(): Promise<void> {
    await expect(this.boutonCreerIndicateur).toBeVisible();
  }

  async expectBoutonExporterVisible(): Promise<void> {
    await expect(this.boutonExporter).toBeVisible();
  }

  async expectPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  async expectPaginationNonVisible(): Promise<void> {
    await expect(this.pagination).not.toBeVisible();
  }

  async expectNombreLignesTableau(nombre: number): Promise<void> {
    await expect(this.tableau.locator("tbody tr")).toHaveCount(nombre);
  }

  async expectFiltreActifVisible(libelle: string): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: libelle }),
    ).toBeVisible();
  }

  async getNombreIndicateursAffiches(): Promise<number> {
    const texte = await this.titreNombreIndicateurs.textContent();
    const match = texte?.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  private get lienIndicateursDesChantiers() {
    return this.page.getByRole("link", { name: /Indicateurs des chantiers/ });
  }

  async expectLienIndicateursDesChangtiersVisible(): Promise<void> {
    await expect(this.lienIndicateursDesChantiers).toBeVisible();
  }

  async expectLienIndicateursDesChantiersNonVisible(): Promise<void> {
    await expect(this.lienIndicateursDesChantiers).not.toBeVisible();
  }
}
