import { Profil } from '@/server/domain/profil/Profil.interface';
import ProfilRepository from '@/server/domain/profil/ProfilRepository';

export default class RécupérerListeProfilUseCase {
  constructor(
    private readonly profilRepository: ProfilRepository,
  ) {}

  async run(): Promise<Profil[]> {
    return this.profilRepository.récupérerTous();
  }
}
