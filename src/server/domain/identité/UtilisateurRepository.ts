// TODO: renommer le rep en habilitation
import { Utilisateur } from '@/server/domain/identité/Utilisateur';
import UtilisateurDTO from '@/server/domain/identité/UtilisateurDTO';

export interface UtilisateurRepository {
  getByEmail(email: string): Promise<Utilisateur>;
  findOneByEmail(email: string): Promise<Utilisateur | null>;
  créerOuRemplacerUtilisateurs(inputUtilisateurs: UtilisateurDTO[]): Promise<void>;
}
