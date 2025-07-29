import {
  CreateContact,
  ContactsApi,
  UpdateContact,
  SendSmtpEmail,
  TransactionalEmailsApi,
} from "@getbrevo/brevo";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { configuration } from "@/config";

const contactsApi = new ContactsApi();
contactsApi.setApiKey(0, configuration.brevo.apiKey);

const emailApi = new TransactionalEmailsApi();
emailApi.setApiKey(0, configuration.brevo.apiKey);

export class BrevoContactInfoLettresService
  implements ContactInfoLettresService
{
  async creerContact(
    email: string,
    nom: string,
    prenom: string,
    listesDiffusionIds: number[],
  ): Promise<void> {
    const contact = new CreateContact();
    contact.email = email;
    contact.attributes = {
      PRENOM: prenom,
      NOM: nom,
    };
    contact.listIds = listesDiffusionIds;
    await contactsApi.createContact(contact);
  }

  async supprimerContact(email: string): Promise<void> {
    await contactsApi.deleteContact(email);
  }

  async modifierContact(
    email: string,
    nom: string,
    prenom: string,
    listesDiffusionAAjouterIds: number[],
    listesDiffusionASupprimerIds: number[],
  ): Promise<void> {
    await contactsApi.updateContact(email, {
      attributes: {
        PRENOM: prenom,
        NOM: nom,
      },
      listIds: listesDiffusionAAjouterIds,
      unlinkListIds: listesDiffusionASupprimerIds,
    });
  }

  async ajouterContactAUneInfoLettre(
    email: string,
    listesDiffusionIds: number[],
  ): Promise<void> {
    const updatePayload: UpdateContact = {
      listIds: listesDiffusionIds,
    };

    await contactsApi.updateContact(email, updatePayload);
  }

  async envoieUnEmail(
    destinataires: { email: string }[],
    templateId: number,
    parametres: object,
  ): Promise<void> {
    let email = new SendSmtpEmail();
    email.to = destinataires;
    email.templateId = templateId;
    email.params = parametres;
    await emailApi.sendTransacEmail(email);
  }
}
