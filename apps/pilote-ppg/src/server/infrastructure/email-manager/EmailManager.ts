import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

export interface EmailManager {
  sendTransactionalEmail(
    destinataires: { email: string }[],
    templateId: number,
    params: object,
  ): Promise<void>;
  createContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void>;
  deleteContact(email: string): Promise<void>;
  updateContact(
    email: string,
    attributes: Partial<{ nom: string; prenom: string; profil: ProfilCode }>,
    listesDiffusionAAjouterIds?: number[],
    listesDiffusionASupprimerIds?: number[],
  ): Promise<void>;
  addContactToLists(email: string, listesDiffusionIds: number[]): Promise<void>;
}
