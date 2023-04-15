// TODO: renommer le rep en habilitation
import { Utilisateur } from '@/server/domain/identité/Utilisateur';
import { InputUtilisateur } from '@/server/infrastructure/accès_données/identité/seed';

export interface UtilisateurRepository {
  getByEmail(email: string): Promise<Utilisateur>;
  findOneByEmail(email: string): Promise<Utilisateur | null>;
  créerOuRemplaceUtilisateurs(inputUtilisateurs: InputUtilisateur[]): Promise<void>;
}
