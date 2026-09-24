import { BrevoClient } from "@getbrevo/brevo";
import { configuration } from "@/config";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";
import { EmailManager } from "./EmailManager";

export class BrevoEmailManager implements EmailManager {
  private readonly brevo: BrevoClient;

  constructor() {
    this.brevo = new BrevoClient({ apiKey: configuration().brevo.apiKey });
  }

  async sendTransactionalEmail(
    destinataires: { email: string }[],
    templateId: number,
    params: object,
  ): Promise<void> {
    const overrideEmail = configuration().brevo.overrideEmailRecipient;
    const recipients = overrideEmail
      ? [{ email: overrideEmail }]
      : destinataires;
    await this.brevo.transactionalEmails.sendTransacEmail(
      {
        to: recipients,
        templateId,
        params: params as Record<string, unknown>,
      },
      // L'envoi n'est pas idempotent et le SDK rejoue les POST sur 408/429/5xx :
      // un 5xx reçu après acceptation côté Brevo enverrait l'email deux fois.
      { maxRetries: 0 },
    );
  }

  async createContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void> {
    await this.brevo.contacts.createContact({
      email,
      attributes: {
        PRENOM: prenom,
        NOM: nom,
        PROFIL: profil,
        _PIXEL_TRACKING_CONSENT: true,
      },
      listIds: listesDiffusionIds,
    });
  }

  async deleteContact(email: string): Promise<void> {
    await this.brevo.contacts.deleteContact({ identifier: email });
  }

  async updateContact(
    email: string,
    attributes: Partial<{ nom: string; prenom: string; profil: ProfilCode }>,
    listesDiffusionAAjouterIds?: number[],
    listesDiffusionASupprimerIds?: number[],
  ): Promise<void> {
    const brevoAttributes: Record<string, string> = {};
    if (attributes.prenom != null) {
      brevoAttributes.PRENOM = attributes.prenom;
    }
    if (attributes.nom != null) {
      brevoAttributes.NOM = attributes.nom;
    }
    if (attributes.profil != null) {
      brevoAttributes.PROFIL = attributes.profil;
    }

    await this.brevo.contacts.updateContact({
      identifier: email,
      attributes: brevoAttributes,
      listIds: listesDiffusionAAjouterIds,
      unlinkListIds: listesDiffusionASupprimerIds,
    });
  }

  async addContactToLists(
    email: string,
    listesDiffusionIds: number[],
  ): Promise<void> {
    await this.brevo.contacts.updateContact({
      identifier: email,
      listIds: listesDiffusionIds,
    });
  }
}
