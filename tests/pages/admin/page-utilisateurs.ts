import { Page, Download, expect } from "@playwright/test";
import { PageUtilisateurDetail } from "./page-utilisateur-detail";
import { HeaderComponent } from "../../components/header.component";
import { BasePage } from "../base.page";

export class PageAdminUtilisateurs extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  private get tableau() {
    return this.page.locator("table", {
      has: this.page.locator("caption", {
        hasText: "Tableau des utilisateurs",
      }),
    });
  }

  private get titreNombreComptes() {
    return this.page
      .getByRole("heading", { level: 2 })
      .filter({ hasText: /\d+ comptes?/ });
  }

  private get barreRecherche() {
    return this.page.getByRole("searchbox", { name: "Rechercher" });
  }

  private get tagTous() {
    return this.page.getByRole("button", { name: "Tous" });
  }

  private get tagActifs() {
    return this.page.getByRole("button", { name: "Comptes actifs" });
  }

  private get tagDesactives() {
    return this.page.getByRole("button", { name: /Comptes désactivés/ });
  }

  private get boutonCreerCompte() {
    return this.page.getByRole("link", { name: /Créer un compte/ });
  }

  private get boutonReinitialiser() {
    return this.page.getByRole("button", { name: /Réinitialiser les filtres/ });
  }

  private get toastSucces() {
    return this.page.locator("[data-sonner-toast][data-type='success']");
  }

  private get lienGestionDesComptes() {
    return this.page.getByRole("link", { name: /Gestion des comptes/ });
  }

  async goto(): Promise<void> {
    await this.lienGestionDesComptes.click();
    await this.titreNombreComptes.waitFor({ state: "visible" });
  }

  async exportCsv(timeout = 120_000): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download", { timeout });
    await this.page
      .getByTestId("form-export")
      .getByRole("button", { name: /Exporter les données/ })
      .click();
    return downloadPromise;
  }

  async clickUtilisateurParEmail(
    email: string,
  ): Promise<PageUtilisateurDetail> {
    await this.tableau.getByRole("row").filter({ hasText: email }).click();
    const pageDetail = new PageUtilisateurDetail(this.page);
    await pageDetail.expectPageChargee();
    return pageDetail;
  }

  async rechercherUtilisateur(texte: string): Promise<void> {
    await this.barreRecherche.fill(texte);
    // attendre le throttle de la recherche
    await this.page.waitForTimeout(600);
  }

  async effacerRecherche(): Promise<void> {
    await this.barreRecherche.clear();
    await this.page.waitForTimeout(600);
  }

  async filtrerParStatut(
    statut: "tous" | "actifs" | "desactives",
  ): Promise<void> {
    const tags = {
      tous: this.tagTous,
      actifs: this.tagActifs,
      desactives: this.tagDesactives,
    };
    await tags[statut].click();
    await this.page.waitForTimeout(600);
  }

  async filtrerParProfil(nomProfil: string): Promise<void> {
    await this.page.getByLabel("Profil(s)").click();
    await this.page
      .getByRole("checkbox", { name: nomProfil })
      .check({ force: true });
    // fermer le dropdown en cliquant ailleurs
    await this.page.getByRole("heading", { level: 1 }).click();
    await this.page.waitForTimeout(600);
  }

  async expectColonneVisible(nomColonne: string): Promise<void> {
    await expect(
      this.tableau.getByRole("columnheader", { name: nomColonne }),
    ).toBeVisible();
  }

  async expectColonneNotVisible(nomColonne: string): Promise<void> {
    await expect(
      this.tableau.getByRole("columnheader", { name: nomColonne }),
    ).not.toBeVisible();
  }

  async expectNombreComptes(nombre: number): Promise<void> {
    const texte = nombre <= 1 ? `${nombre} compte` : `${nombre} comptes`;
    await expect(this.titreNombreComptes).toHaveText(texte);
  }

  async expectUtilisateurDansTableau(email: string): Promise<void> {
    await expect(
      this.tableau.getByRole("row").filter({ hasText: email }),
    ).toBeVisible();
  }

  async expectUtilisateurAbsentDuTableau(email: string): Promise<void> {
    await expect(
      this.tableau.getByRole("row").filter({ hasText: email }),
    ).not.toBeVisible();
  }

  async expectProfilDansFiltre(nomProfil: string): Promise<void> {
    await this.page.getByLabel("Profil(s)").click();
    await expect(
      this.page.getByRole("checkbox", { name: nomProfil }),
    ).toBeVisible();
    await this.page.getByLabel("Profil(s)").click();
  }

  async expectProfilAbsentDuFiltre(nomProfil: string): Promise<void> {
    await this.page.getByLabel("Profil(s)").click();
    await expect(
      this.page.getByRole("checkbox", { name: nomProfil }),
    ).not.toBeVisible();
    await this.page.getByLabel("Profil(s)").click();
  }

  async expectBoutonCreerCompteVers(url: RegExp | string): Promise<void> {
    await expect(this.boutonCreerCompte).toBeVisible();
    await expect(this.boutonCreerCompte).toHaveAttribute("href", url);
  }

  async expectAlerte(titre: string | RegExp): Promise<void> {
    const toast = this.page
      .locator("[data-sonner-toast][data-type='success']")
      .filter({ hasText: titre });
    await expect(toast).toBeVisible();
  }

  async expectGestionDesComptesVisible(): Promise<void> {
    await expect(this.lienGestionDesComptes).toBeVisible();
  }

  async expectGestionDesComptesNotVisible(): Promise<void> {
    await expect(this.lienGestionDesComptes).not.toBeVisible();
  }
}
