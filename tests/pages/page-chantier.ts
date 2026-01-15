import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { HeaderComponent } from "../components/header.component";

export class PageChantier extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async expectTitle(id: string, nom: string): Promise<void> {
    await expect(this.page).toHaveTitle(`Chantier ${id} - ${nom} - PILOTE`);
  }

  async expectStructure(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: /Avancement du chantier/ })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: /Responsables/ })).toBeVisible();
    await expect(this.page.getByText(/^Minimum$/)).toBeVisible();
    await expect(this.page.getByText(/^Médiane$/)).toBeVisible();
    await expect(this.page.getByText(/^Maximum$/)).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Météo et synthèse des résultats$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Répartition géographique$/ }),
    ).toBeVisible();
    await expect(this.page.getByRole("heading", { name: /^Objectifs$/ })).toBeVisible();
    await expect(this.page.getByRole("button", { name: /^Notre ambition$/ })).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /^Ce qui a déjà été fait$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /^Ce qui reste à faire$/ }),
    ).toBeVisible();
    await expect(this.page.getByRole("heading", { name: /^Indicateurs \(5\)$/ })).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /^Indicateurs pris en compte dans le taux d'avancement du territoire \(5\)$/,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Décisions stratégiques$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Suivi des décisions stratégiques$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Commentaires du chantier$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /^Autres résultats obtenus \(non corrélés aux indicateurs\)$/,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Risques et freins à lever$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Solutions et actions à venir$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Exemples concrets de réussite$/ }),
    ).toBeVisible();
  }
}
