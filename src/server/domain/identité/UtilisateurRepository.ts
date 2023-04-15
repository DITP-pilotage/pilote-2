// TODO: renommer le rep en habilitation
import { Utilisateur } from '@/server/domain/identité/Utilisateur';
import { InputUtilisateur } from '@/server/infrastructure/accès_données/identité/seed';

export interface UtilisateurRepository {
  findOneByEmail(email: string): Promise<Utilisateur | null>;
  créerUtilisateurs(inputUtilisateurs: InputUtilisateur[]): Promise<void>;
}
