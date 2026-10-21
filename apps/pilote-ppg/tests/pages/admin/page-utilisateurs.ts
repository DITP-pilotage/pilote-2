import { Page, Download, expect } from "@playwright/test";
import { PageUtilisateurDetail } from "./page-utilisateur-detail";
import { HeaderComponent } from "../../components/header.component";
import { BasePage } from "../base.page";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminUtilisateurs extends BasePage {
  readonly header: HeaderComponent;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
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
      .filter({ hasText: /\d{1,10} comptes?/ });
  }

  private get barreRecherche() {
    return this.page.getByRole("searchbox", { name: "Rechercher" });
  }

  private get tagTous() {
    return this.page.getByRole("radio", { name: "Tous" });
  }

  private get tagActifs() {
    return this.page.getByRole("radio", { name: "Comptes actifs" });
  }

  private get tagDesactives() {
    return this.page.getByRole("radio", { name: /Comptes désactivés/ });
  }

  private get boutonCreerCompte() {
    return this.page.getByRole("link", { name: /Créer un compte/ });
  }

  private get alerteSucces() {
    return this.page
      .locator('[role="status"][data-color="success"]')
      .getByRole("heading");
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
    const pageDetail = new PageUtilisateurDetail(this.page, this.e2eContext);
    await pageDetail.expectPageChargee();
    return pageDetail;
  }

  async rechercherUtilisateur(texte: string): Promise<void> {
    await this.attendreLaListe(
      (url) => url.searchParams.get("q") === texte,
      async () => {
        await this.barreRecherche.fill(texte);
        await expect(this.barreRecherche).toHaveValue(texte);
      },
    );
  }

  async effacerRecherche(): Promise<void> {
    // Le clear peut être écrasé par une synchro URL ↔ state (nuqs) qui
    // réinjecte l'ancienne valeur après coup. On force un blur (Tab) pour
    // commiter immédiatement, puis on vérifie que la valeur reste vide.
    await this.attendreLaListe(
      (url) => !url.searchParams.get("q"),
      async () => {
        await expect(async () => {
          await this.barreRecherche.clear();
          await this.barreRecherche.press("Tab");
          await expect(this.barreRecherche).toHaveValue("", { timeout: 500 });
        }).toPass({ timeout: 10_000 });
      },
    );
  }

  private async ensureRechercheVide(): Promise<void> {
    const valeurActuelle = await this.barreRecherche.inputValue();
    if (valeurActuelle !== "") {
      await this.effacerRecherche();
    }
  }

  async filtrerParStatut(
    statut: "tous" | "actifs" | "desactives",
  ): Promise<void> {
    const tags = {
      tous: { tag: this.tagTous, typeCompte: null },
      actifs: { tag: this.tagActifs, typeCompte: "actif" },
      desactives: { tag: this.tagDesactives, typeCompte: "desactive" },
    };
    const { tag, typeCompte } = tags[statut];
    if (await tag.isChecked()) {
      return;
    }
    await this.attendreLaListe(
      (url) => url.searchParams.get("typeCompte") === typeCompte,
      () => tag.click(),
    );
  }

  async filtrerParProfil(nomProfil: string): Promise<void> {
    await this.ensureRechercheVide();

    const dropdownProfil = this.page.getByLabel("Profil(s)");
    const checkbox = this.page.getByRole("checkbox", { name: nomProfil });
    const label = this.page.locator("label").filter({ hasText: nomProfil });

    await expect(async () => {
      await dropdownProfil.click();
      await label.waitFor({ state: "visible", timeout: 2_000 });
    }).toPass({ timeout: 10_000 });

    await this.attendreLaListe(
      (url) => url.searchParams.get("profils") !== null,
      async () => {
        await label.click();
        await expect(checkbox).toBeChecked();
        // fermer le dropdown en cliquant ailleurs
        await this.page.getByRole("heading", { level: 1 }).click();
      },
    );
  }

  // Les filtres et la recherche rechargent la liste côté serveur (nuqs, shallow: false).
  private async attendreLaListe(
    correspondALaRequete: (url: URL) => boolean,
    action: () => Promise<void>,
  ): Promise<void> {
    const listeRechargee = this.page.waitForResponse((reponse) => {
      const url = new URL(reponse.url());
      return (
        url.pathname.endsWith("/admin/utilisateurs.json") &&
        correspondALaRequete(url)
      );
    });
    await action();
    await listeRechargee;
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

  async expectUtilisateurDansTableau(email: string): Promise<void> {
    await expect(
      this.tableau.getByRole("row").filter({ hasText: email }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectUtilisateurAbsentDuTableau(email: string): Promise<void> {
    await expect(
      this.tableau.getByRole("row").filter({ hasText: email }),
    ).not.toBeVisible({ timeout: 15_000 });
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
    await expect(this.alerteSucces).toBeVisible();
    await expect(this.alerteSucces).toHaveText(titre);
  }

  async expectGestionDesComptesNotVisible(): Promise<void> {
    await expect(this.lienGestionDesComptes).not.toBeVisible();
  }
}
