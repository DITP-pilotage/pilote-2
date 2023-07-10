import UtilisateurIAM from './UtilisateurIAM.interface';

export interface UtilisateurIAMRepository {
  ajouteUtilisateurs(utilisateurs: UtilisateurIAM[]): Promise<void>;
  supprime(email: string): Promise<void>
}
