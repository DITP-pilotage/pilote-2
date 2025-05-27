export interface ContactInfoLettresService {
  creerContact(email: string, nom: string, prenom: string, listesDiffusionIds: number[]): Promise<void>
  supprimerContact(email: string): Promise<void>
}
