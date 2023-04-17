// TODO: renommer le rep en habilitation
import { Utilisateur } from '@/server/domain/identité/Utilisateur';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';

export interface UtilisateurRepository {
  getByEmail(email: string): Promise<Utilisateur>;
  findOneByEmail(email: string): Promise<Utilisateur | null>;
  créerOuRemplacerUtilisateurs(inputUtilisateurs: UtilisateurPourImport[]): Promise<void>;
}
