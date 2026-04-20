import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

export interface ContactInfoLettresService {
  creerContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void>;
  supprimerContact(email: string): Promise<void>;
  modifierContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionAAjouterIds: number[],
    listesDiffusionASupprimerIds: number[],
  ): Promise<void>;
  ajouterContactAUneInfoLettre(
    email: string,
    listesDiffusionIds: number[],
  ): Promise<void>;
  envoieUnEmail(
    destinataires: { email: string }[],
    templateId: number,
    parametres: object,
  ): Promise<void>;
}
