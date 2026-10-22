import { Page, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminAlbertPermissions extends BasePage {
  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
  }

  private switchProfil(profilName: string) {
    return this.page.getByRole("switch", {
      name: `Accès à l'assistant IA pour le profil ${profilName}`,
    });
  }

  private ligneUtilisateur(email: string) {
    return this.page.getByRole("row").filter({ hasText: email });
  }

  async gotoProfils(): Promise<void> {
    await this.page.goto(
      "/panel-administrateur/albert?onglet=permissions-profils",
    );
    await expect(
      this.page.getByText(
        "Les administrateurs DITP ont toujours accès à l'assistant IA.",
      ),
    ).toBeVisible();
  }

  async gotoEmails(): Promise<void> {
    await this.page.goto(
      "/panel-administrateur/albert?onglet=permissions-emails",
    );
    await expect(
      this.page.getByRole("button", { name: "Ajouter un utilisateur…" }),
    ).toBeVisible();
  }

  async enableProfil(profilCode: string, profilName: string): Promise<void> {
    const toggle = this.switchProfil(profilName);
    await expect(toggle).not.toBeChecked();
    this.e2eContext.track("ALBERT_ACCESS_PROFIL_ENABLED", { profilCode });
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeEnabled();
  }

  async disableProfil(profilName: string): Promise<void> {
    const toggle = this.switchProfil(profilName);
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeEnabled();
  }

  async addUtilisateur(query: string, email: string): Promise<void> {
    await this.page
      .getByRole("button", { name: "Ajouter un utilisateur…" })
      .click();
    await this.page
      .getByPlaceholder("Rechercher par nom, prénom ou email")
      .fill(query);
    this.e2eContext.track("ALBERT_ACCESS_UTILISATEUR_ADDED", { email });
    await this.page.getByRole("option").filter({ hasText: email }).click();
    await expect(this.ligneUtilisateur(email)).toBeVisible();
  }

  async expectProfilMention(email: string, profilName: string): Promise<void> {
    await expect(this.ligneUtilisateur(email)).toContainText(
      `Déjà autorisé via le profil ${profilName}`,
    );
  }

  async expectNoProfilMention(email: string): Promise<void> {
    await expect(this.ligneUtilisateur(email)).toBeVisible();
    await expect(this.ligneUtilisateur(email)).not.toContainText(
      "Déjà autorisé via le profil",
    );
  }
}
