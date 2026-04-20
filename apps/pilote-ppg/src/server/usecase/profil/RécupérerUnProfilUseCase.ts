import { Profil } from "@/server/domain/profil/Profil.interface";
import ProfilRepository from "@/server/domain/profil/ProfilRepository";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import type { Inject } from "@/server/legacy/module";

export default class RécupérerUnProfilUseCase {
  private readonly profilRepository: ProfilRepository;

  constructor({ profilRepository }: Inject<"profilRepository">) {
    this.profilRepository = profilRepository;
  }

  async run(profilCode: ProfilCode): Promise<Profil | null> {
    return this.profilRepository.récupérer(profilCode);
  }
}
