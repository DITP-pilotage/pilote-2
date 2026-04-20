import {
  SendSmtpEmail,
  TransactionalEmailsApi,
  ContactsApi,
  CreateContact,
  UpdateContact,
} from "@getbrevo/brevo";
import { configuration } from "@/config";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";
import { EmailManager } from "./EmailManager";

export class BrevoEmailManager implements EmailManager {
  private readonly transactionalEmailsApi: TransactionalEmailsApi;

  private readonly contactsApi: ContactsApi;

  constructor() {
    const apiKey = configuration().brevo.apiKey;

    this.transactionalEmailsApi = new TransactionalEmailsApi();
    this.transactionalEmailsApi.setApiKey(0, apiKey);

    this.contactsApi = new ContactsApi();
    this.contactsApi.setApiKey(0, apiKey);
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
    const email = new SendSmtpEmail();
    email.to = recipients;
    email.templateId = templateId;
    email.params = params;
    await this.transactionalEmailsApi.sendTransacEmail(email);
  }

  async createContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void> {
    const contact = new CreateContact();
    contact.email = email;
    contact.attributes = {
      PRENOM: prenom,
      NOM: nom,
      PROFIL: profil,
    };
    contact.listIds = listesDiffusionIds;
    await this.contactsApi.createContact(contact);
  }

  async deleteContact(email: string): Promise<void> {
    await this.contactsApi.deleteContact(email);
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

    const updatePayload: UpdateContact = {
      attributes: brevoAttributes,
      listIds: listesDiffusionAAjouterIds,
      unlinkListIds: listesDiffusionASupprimerIds,
    };

    await this.contactsApi.updateContact(email, updatePayload);
  }

  async addContactToLists(
    email: string,
    listesDiffusionIds: number[],
  ): Promise<void> {
    const updatePayload: UpdateContact = {
      listIds: listesDiffusionIds,
    };

    await this.contactsApi.updateContact(email, updatePayload);
  }
}
