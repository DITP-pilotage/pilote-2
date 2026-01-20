import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";
import { EmailManager } from "@/server/infrastructure/email-manager";

export class BrevoContactInfoLettresService
  implements ContactInfoLettresService
{
  constructor(private readonly deps: { emailManager: EmailManager }) {}

  async creerContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void> {
    await this.deps.emailManager.createContact(
      email,
      nom,
      prenom,
      profil,
      listesDiffusionIds,
    );
  }

  async supprimerContact(email: string): Promise<void> {
    await this.deps.emailManager.deleteContact(email);
  }

  async modifierContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionAAjouterIds: number[],
    listesDiffusionASupprimerIds: number[],
  ): Promise<void> {
    await this.deps.emailManager.updateContact(
      email,
      { nom, prenom, profil },
      listesDiffusionAAjouterIds,
      listesDiffusionASupprimerIds,
    );
  }

  async ajouterContactAUneInfoLettre(
    email: string,
    listesDiffusionIds: number[],
  ): Promise<void> {
    await this.deps.emailManager.addContactToLists(email, listesDiffusionIds);
  }

  async envoieUnEmail(
    destinataires: { email: string }[],
    templateId: number,
    parametres: object,
  ): Promise<void> {
    await this.deps.emailManager.sendTransactionalEmail(
      destinataires,
      templateId,
      parametres,
    );
  }
}
