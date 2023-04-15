import UtilisateurPourIAM from '@/server/domain/identité/UtilisateurPourIAM';

export interface UtilisateurIAMRepository {
  ajouteUtilisateurs(utilisateurs: UtilisateurPourIAM[]): Promise<void>;
}
