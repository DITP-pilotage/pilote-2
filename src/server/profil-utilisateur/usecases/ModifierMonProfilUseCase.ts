import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";

type Dependencies = {
  profilUtilisateurRepository: ProfilUtilisateurRepository;
};

type ModifierMonProfilInput = {
  nom: string;
  prenom: string;
  fonction: string | null;
};

export class ModifierMonProfilUseCase {
  private readonly profilUtilisateurRepository: ProfilUtilisateurRepository;

  constructor({ profilUtilisateurRepository }: Dependencies) {
    this.profilUtilisateurRepository = profilUtilisateurRepository;
  }

  async run(
    utilisateurId: string,
    input: ModifierMonProfilInput,
  ): Promise<void> {
    await this.profilUtilisateurRepository.modifierProfil(utilisateurId, {
      nom: input.nom,
      prenom: input.prenom,
      fonction: input.fonction,
    });
  }
}
