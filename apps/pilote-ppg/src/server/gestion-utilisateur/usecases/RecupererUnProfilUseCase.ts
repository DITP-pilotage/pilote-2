import { Profil } from "@/shared/profil/Profil.interface";
import { ProfilRepository } from "@/server/gestion-utilisateur/infrastructure/sql/ProfilRepository";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export class RecupererUnProfilUseCase {
  private readonly profilRepository: ProfilRepository;

  constructor({ profilRepository }: { profilRepository: ProfilRepository }) {
    this.profilRepository = profilRepository;
  }

  async run(profilCode: ProfilCode): Promise<Profil | null> {
    return this.profilRepository.récupérer(profilCode);
  }
}
