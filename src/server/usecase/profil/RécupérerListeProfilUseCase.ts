import ProfilSQLRepository from '@/server/infrastructure/accès_données/profil/ProfilSQLRepository';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Profil } from '@/server/domain/profil/Profil.interface';

export default class RécupérerListeProfilUseCase {
  constructor(
    private readonly profilRepository: ProfilSQLRepository = dependencies.getProfilRepository(),
  ) {}

  async run(): Promise<Profil[]> {
    return this.profilRepository.récupérerTous();
  }
}
