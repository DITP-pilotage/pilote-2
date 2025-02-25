import { Profil } from '@/server/gestion-utilisateur/domain/Profil';

export interface ProfilRepository {
  recupererTous(): Promise<Profil[]>
}
