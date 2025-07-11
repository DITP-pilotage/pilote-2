export interface ContactInfoLettresService {
  creerContact(email: string, nom: string, prenom: string, listesDiffusionIds: number[]): Promise<void>
  supprimerContact(email: string): Promise<void>
  modifierContact(email: string, nom: string, prenom: string, listesDiffusionAAjouterIds: number[], listesDiffusionASupprimerIds: number[]): Promise<void>
  ajouterContactAUneInfoLettre(email: string, listesDiffusionIds: number[]): Promise<void>
  envoieUnEmail(destinataires: { email : string }[], templateId: number, parametres: object): Promise<void>
}
