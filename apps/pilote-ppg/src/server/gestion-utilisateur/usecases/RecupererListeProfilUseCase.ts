import { ProfilRepository } from "@/server/gestion-utilisateur/domain/ports/ProfilRepository";
import { Profil } from "@/shared/profil/Profil.interface";

interface Dependencies {
  profilRepository: ProfilRepository;
}

export class RecupererListeProfilUseCase {
  private readonly profilRepository: ProfilRepository;

  constructor({ profilRepository }: Dependencies) {
    this.profilRepository = profilRepository;
  }

  async run(): Promise<Profil[]> {
    return this.profilRepository.recupererTous();
  }
}
