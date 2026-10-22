import { Page, Download, expect } from "@playwright/test";
import { PageUtilisateurDetail } from "./page-utilisateur-detail";
import { HeaderComponent } from "../../components/header.component";
import { BasePage } from "../base.page";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminUtilisateurs extends BasePage {
  readonly header: HeaderComponent;

  private pendingListRequests = 0;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
    this.header = new HeaderComponent(page);
    const isListRequest = (url: string) => url.includes("utilisateur.list");
    page.on("request", (request) => {
      if (isListRequest(request.url())) this.pendingListRequests++;
    });
    const onRequestDone = (request: { url(): string }) => {
      if (isListRequest(request.url())) this.pendingListRequests--;
    };
    page.on("requestfinished", onRequestDone);
    page.on("requestfailed", onRequestDone);
  }

  private get table() {
    return this.page.locator("table", {
      has: this.page.locator("caption", {
        hasText: "Tableau des utilisateurs",
      }),
    });
  }

  private get utilisateursCountHeading() {
    return this.page
      .getByRole("heading", { level: 2 })
      .filter({ hasText: /\d{1,10} comptes?/ });
  }

  private get searchBox() {
    return this.page.getByRole("searchbox", { name: "Rechercher" });
  }

  private get allTag() {
    return this.page.getByRole("radio", { name: "Tous" });
  }

  private get activeTag() {
    return this.page.getByRole("radio", { name: "Comptes actifs" });
  }

  private get deactivatedTag() {
    return this.page.getByRole("radio", { name: /Comptes désactivés/ });
  }

  private get createUtilisateurButton() {
    return this.page.getByRole("link", { name: /Créer un compte/ });
  }

  private get successAlert() {
    return this.page
      .locator('[role="status"][data-color="success"]')
      .getByRole("heading");
  }

  private get gestionDesComptesLink() {
    return this.page.getByRole("link", { name: /Gestion des comptes/ });
  }

  async goto(): Promise<void> {
    await this.gestionDesComptesLink.click();
    await this.utilisateursCountHeading.waitFor({ state: "visible" });
  }

  async exportCsv(timeout = 120_000): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download", { timeout });
    await this.page
      .getByTestId("form-export")
      .getByRole("button", { name: /Exporter les données/ })
      .click();
    return downloadPromise;
  }

  async clickUtilisateurByEmail(email: string): Promise<PageUtilisateurDetail> {
    await this.table.getByRole("row").filter({ hasText: email }).click();
    const pageDetail = new PageUtilisateurDetail(this.page, this.e2eContext);
    await pageDetail.expectPageLoaded();
    return pageDetail;
  }

  async searchUtilisateur(text: string): Promise<void> {
    await this.waitForListReload(
      (url) => url.searchParams.get("q") === text,
      async () => {
        await this.searchBox.fill(text);
        await expect(this.searchBox).toHaveValue(text);
      },
    );
  }

  async clearSearch(): Promise<void> {
    // Le clear peut être écrasé par une synchro URL ↔ state (nuqs) qui
    // réinjecte l'ancienne valeur après coup. On force un blur (Tab) pour
    // commiter immédiatement, puis on vérifie que la valeur reste vide.
    await this.waitForListReload(
      (url) => !url.searchParams.get("q"),
      async () => {
        await expect(async () => {
          await this.searchBox.clear();
          await this.searchBox.press("Tab");
          await expect(this.searchBox).toHaveValue("", { timeout: 500 });
        }).toPass({ timeout: 10_000 });
      },
    );
  }

  private async ensureSearchEmpty(): Promise<void> {
    const currentValue = await this.searchBox.inputValue();
    if (currentValue !== "") {
      await this.clearSearch();
    }
  }

  async filterByStatut(
    statut: "tous" | "actifs" | "desactives",
  ): Promise<void> {
    const tags = {
      tous: { tag: this.allTag, typeCompte: null },
      actifs: { tag: this.activeTag, typeCompte: "actif" },
      desactives: { tag: this.deactivatedTag, typeCompte: "desactive" },
    };
    const { tag, typeCompte } = tags[statut];
    if (await tag.isChecked()) {
      return;
    }
    await this.waitForListReload(
      (url) => url.searchParams.get("typeCompte") === typeCompte,
      () => tag.click(),
    );
  }

  async filterByProfil(profilName: string): Promise<void> {
    await this.ensureSearchEmpty();

    const profilDropdown = this.page.getByLabel("Profil(s)");
    const checkbox = this.page.getByRole("checkbox", { name: profilName });
    const label = this.page.locator("label").filter({ hasText: profilName });

    await expect(async () => {
      await profilDropdown.click();
      await label.waitFor({ state: "visible", timeout: 2_000 });
    }).toPass({ timeout: 10_000 });

    await this.waitForListReload(
      (url) => url.searchParams.get("profils") !== null,
      async () => {
        await label.click();
        await expect(checkbox).toBeChecked();
        // fermer le dropdown en cliquant ailleurs
        await this.page.getByRole("heading", { level: 1 }).click();
      },
    );
  }

  // La liste suit les paramètres d'URL (nuqs) et se recharge par tRPC, sauf si le
  // résultat est déjà en cache : on attend l'URL, puis la fin des chargements en cours.
  private async waitForListReload(
    matchesUrl: (url: URL) => boolean,
    action: () => Promise<void>,
  ): Promise<void> {
    await action();
    await this.page.waitForURL(matchesUrl);
    await expect.poll(() => this.pendingListRequests).toBe(0);
  }

  async expectColumnVisible(columnName: string): Promise<void> {
    await expect(
      this.table.getByRole("columnheader", { name: columnName }),
    ).toBeVisible();
  }

  async expectColumnNotVisible(columnName: string): Promise<void> {
    await expect(
      this.table.getByRole("columnheader", { name: columnName }),
    ).not.toBeVisible();
  }

  async expectUtilisateurInTable(email: string): Promise<void> {
    await expect(
      this.table.getByRole("row").filter({ hasText: email }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectUtilisateurNotInTable(email: string): Promise<void> {
    await expect(
      this.table.getByRole("row").filter({ hasText: email }),
    ).not.toBeVisible({ timeout: 15_000 });
  }

  async expectProfilInFilter(profilName: string): Promise<void> {
    await this.page.getByLabel("Profil(s)").click();
    await expect(
      this.page.getByRole("checkbox", { name: profilName }),
    ).toBeVisible();
    await this.page.getByLabel("Profil(s)").click();
  }

  async expectProfilNotInFilter(profilName: string): Promise<void> {
    await this.page.getByLabel("Profil(s)").click();
    await expect(
      this.page.getByRole("checkbox", { name: profilName }),
    ).not.toBeVisible();
    await this.page.getByLabel("Profil(s)").click();
  }

  async expectCreateUtilisateurButtonTo(url: RegExp | string): Promise<void> {
    await expect(this.createUtilisateurButton).toBeVisible();
    await expect(this.createUtilisateurButton).toHaveAttribute("href", url);
  }

  async expectAlert(title: string | RegExp): Promise<void> {
    await expect(this.successAlert).toBeVisible();
    await expect(this.successAlert).toHaveText(title);
  }

  async expectGestionDesComptesNotVisible(): Promise<void> {
    await expect(this.gestionDesComptesLink).not.toBeVisible();
  }
}
