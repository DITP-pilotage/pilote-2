import { Profil } from '@/server/domain/profil/Profil.interface';
import ProfilRepository from '@/server/domain/profil/ProfilRepository';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default class RécupérerUnProfilUseCase {
  constructor(
    private readonly profilRepository: ProfilRepository,
  ) {}

  async run(profilCode: ProfilCode): Promise<Profil | null> {
    return this.profilRepository.récupérer(profilCode);
  }
}
