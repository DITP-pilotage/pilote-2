import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export interface ProfilRepository {
  récupérerTous(): Promise<Profil[]>
  récupérer(profilCode: ProfilCode): Promise<Profil | null>
}
