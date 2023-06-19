import { Profil } from '@/server/domain/profil/Profil.interface';

export default interface ProfilRepository {
  récupérerTous(): Promise<Profil[]>
}
