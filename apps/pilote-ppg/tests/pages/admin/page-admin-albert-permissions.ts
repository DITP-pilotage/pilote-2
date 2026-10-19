import { Page, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { E2ETestContext } from "../../e2e-test-context";

export class PageAdminAlbertPermissions extends BasePage {
  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
  }

  private switchProfil(profilNom: string) {
    return this.page.getByRole("switch", {
      name: `Accès à l'assistant IA pour le profil ${profilNom}`,
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

  async activerProfil(profilCode: string, profilNom: string): Promise<void> {
    const interrupteur = this.switchProfil(profilNom);
    await expect(interrupteur).not.toBeChecked();
    this.e2eContext.track("ACCES_ALBERT_PROFIL_ACTIVE", { profilCode });
    await interrupteur.click();
    await expect(interrupteur).toBeChecked();
    await expect(interrupteur).toBeEnabled();
  }

  async desactiverProfil(profilNom: string): Promise<void> {
    const interrupteur = this.switchProfil(profilNom);
    await expect(interrupteur).toBeChecked();
    await interrupteur.click();
    await expect(interrupteur).not.toBeChecked();
    await expect(interrupteur).toBeEnabled();
  }

  async ajouterUtilisateur(recherche: string, email: string): Promise<void> {
    await this.page
      .getByRole("button", { name: "Ajouter un utilisateur…" })
      .click();
    await this.page
      .getByPlaceholder("Rechercher par nom, prénom ou email")
      .fill(recherche);
    this.e2eContext.track("ACCES_ALBERT_UTILISATEUR_AJOUTE", { email });
    await this.page.getByRole("option").filter({ hasText: email }).click();
    await expect(this.ligneUtilisateur(email)).toBeVisible();
  }

  async expectMentionProfil(email: string, profilNom: string): Promise<void> {
    await expect(this.ligneUtilisateur(email)).toContainText(
      `Déjà autorisé via le profil ${profilNom}`,
    );
  }

  async expectSansMentionProfil(email: string): Promise<void> {
    await expect(this.ligneUtilisateur(email)).toBeVisible();
    await expect(this.ligneUtilisateur(email)).not.toContainText(
      "Déjà autorisé via le profil",
    );
  }
}
