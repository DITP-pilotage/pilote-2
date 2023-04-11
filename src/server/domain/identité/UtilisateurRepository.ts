// TODO: renommer le rep en habilitation
import { Utilisateur } from '@/server/domain/identité/Utilisateur';

export interface UtilisateurRepository {
  findOneByEmail(email: string): Promise<Utilisateur | null>;
}
