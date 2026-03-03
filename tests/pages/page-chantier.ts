import { Page, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { BasePage } from "./base.page";
import { PageMiseAJourDonnees } from "./page-mise-a-jour-donnees";
import { HeaderComponent } from "../components/header.component";
import { PvaIndicateurComponent } from "../components/pva-indicateur.component";

export class PageChantier extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async expectTitle(id: string, nom: string): Promise<void> {
    await expect(this.page).toHaveTitle(`Chantier ${id} - ${nom} - PILOTE`);
  }

  async gotoMiseAJourDonnees(): Promise<PageMiseAJourDonnees> {
    await this.page
      .getByRole("link", { name: /Mettre à jour les données/ })
      .click();
    await expect(
      this.page.getByRole("heading", { name: /Sélectionnez l'indicateur/ }),
    ).toBeVisible();
    return new PageMiseAJourDonnees(this.page);
  }

  async selectChantierAvecTerritoire(
    chantierId: string,
    territoireCode: string,
  ): Promise<void> {
    await this.page.goto(`/chantier/CH-${chantierId}/${territoireCode}`);
    await expect(
      this.page.getByRole("heading", { name: /Avancement du chantier/ }),
    ).toBeVisible();
  }

  async expandAutresIndicateurs(): Promise<void> {
    const accordionButton = this.page.getByRole("button", {
      name: /Autres indicateurs/,
    });
    const isExpanded = await accordionButton.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await accordionButton.click();
    }
  }

  getIndicateurPva(indicateurId: string): PvaIndicateurComponent {
    return new PvaIndicateurComponent(this.page, indicateurId);
  }

  async expectStructure(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /Avancement du chantier/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /Responsables/ }),
    ).toBeVisible();
    await expect(this.page.getByText(/^Minimum$/)).toBeVisible();
    await expect(this.page.getByText(/^Médiane$/)).toBeVisible();
    await expect(this.page.getByText(/^Maximum$/)).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /^Météo et synthèse des résultats$/,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Répartition géographique$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Objectifs$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /^Notre ambition$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /^Ce qui a déjà été fait$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /^Ce qui reste à faire$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Indicateurs \(5\)$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /^Indicateurs pris en compte dans le taux d'avancement du territoire \(5\)$/,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /^Décisions stratégiques$/ }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /^Suivi des décisions stratégiques$/,
      }),
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
      this.page.getByRole("heading", {
        name: /^Solutions et actions à venir$/,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", {
        name: /^Exemples concrets de réussite$/,
      }),
    ).toBeVisible();
  }

  async expectHistoriqueCommentaire(
    typeCommentaire: string = "risquesEtFreinsÀLever",
  ): Promise<void> {
    const id = randomUUID();
    await this.page.getByLabel(`bouton-modifier-${typeCommentaire}`).click();
    await this.page
      .getByLabel(`champ d'edition pour le contenu de ${typeCommentaire}`)
      .fill(`Un commentaire test e2e ${id}`);

    await this.page.getByText("Publier").click();

    await this.page.waitForSelector("#alerte");

    await expect(this.page.getByText("Modification effectuée")).toBeVisible();

    await this.page
      .getByLabel(`Voir l'histoire des commentaires du type ${typeCommentaire}`)
      .click();

    const commentaireHistoriqueModal = this.page.getByRole("dialog");

    await expect(commentaireHistoriqueModal).toContainText(
      "Historique - commentaires",
    );
    await expect(commentaireHistoriqueModal).toContainText(
      `Un commentaire test e2e ${id}`,
    );

    await this.page.getByRole("button", { name: /Fermer/ }).click();
  }
}
