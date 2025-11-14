export interface UtilisateurRepository {
  recupererUtilisateursParProfilEtTerritoire(args: {
    profil: string;
    territoireCode: string;
  }): Promise<string[]>;
  recupererEmailsParUtilisateurIds(utilisateurIds: string[]): Promise<string[]>;
}
