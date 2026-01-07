import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

export interface EmailManager {
  /**
   * Envoie un email transactionnel en utilisant un template Brevo
   * @param destinataires - Liste des destinataires
   * @param templateId - ID du template Brevo à utiliser
   * @param params - Paramètres à injecter dans le template
   */
  sendTransactionalEmail(
    destinataires: { email: string }[],
    templateId: number,
    params: object,
  ): Promise<void>;

  /**
   * Crée un nouveau contact dans Brevo
   * @param email - Email du contact
   * @param nom - Nom du contact
   * @param prenom - Prénom du contact
   * @param profil - Code profil de l'utilisateur
   * @param listesDiffusionIds - IDs des listes de diffusion à assigner
   */
  createContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionIds: number[],
  ): Promise<void>;

  /**
   * Supprime un contact de Brevo
   * @param email - Email du contact à supprimer
   */
  deleteContact(email: string): Promise<void>;

  /**
   * Met à jour les attributs et listes d'un contact
   * @param email - Email du contact
   * @param nom - Nouveau nom
   * @param prenom - Nouveau prénom
   * @param profil - Nouveau profil
   * @param listesDiffusionAAjouterIds - IDs des listes à ajouter
   * @param listesDiffusionASupprimerIds - IDs des listes à retirer
   */
  updateContact(
    email: string,
    nom: string,
    prenom: string,
    profil: ProfilCode,
    listesDiffusionAAjouterIds: number[],
    listesDiffusionASupprimerIds: number[],
  ): Promise<void>;

  /**
   * Ajoute un contact existant à des listes de diffusion
   * @param email - Email du contact
   * @param listesDiffusionIds - IDs des listes à assigner
   */
  addContactToLists(email: string, listesDiffusionIds: number[]): Promise<void>;
}
