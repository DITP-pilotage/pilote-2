import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";
import { EmailManager } from "./EmailManager";

export class StubEmailManager implements EmailManager {
  async sendTransactionalEmail(
    destinataires: { email: string }[],
    templateId: number,
    params: object,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("📧 [STUB] Email sending disabled - Would have sent email:", {
      destinataires: destinataires.map((d) => d.email),
      templateId,
      params,
    });
  }

  async createContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      "👤 [STUB] Email sending disabled - Would have created contact:",
      {
        email,
        nom,
        prenom,
        profil,
        listesDiffusionIds,
      },
    );
  }

  async deleteContact(email: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      "🗑️  [STUB] Email sending disabled - Would have deleted contact:",
      {
        email,
      },
    );
  }

  async updateContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionAAjouterIds: number[],
    listesDiffusionASupprimerIds: number[],
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      "✏️  [STUB] Email sending disabled - Would have updated contact:",
      {
        email,
        nom,
        prenom,
        profil,
        listesDiffusionAAjouterIds,
        listesDiffusionASupprimerIds,
      },
    );
  }

  async addContactToLists(
    email: string,
    listesDiffusionIds: number[],
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      "📋 [STUB] Email sending disabled - Would have added contact to lists:",
      {
        email,
        listesDiffusionIds,
      },
    );
  }
}
