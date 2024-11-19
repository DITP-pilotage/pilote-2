import UtilisateurIAM from '@/server/gestion-utilisateur/domain/UtilisateurIAM.interface';

export interface UtilisateurIAMRepository {
  ajouteUtilisateurs(utilisateurs: UtilisateurIAM[]): Promise<void>;
  supprime(email: string): Promise<void>
  desactive(email: string): Promise<void>
  reactive(email: string): Promise<void>
}
