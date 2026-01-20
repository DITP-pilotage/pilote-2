import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
};

type ModifierMonProfilInput = {
  nom: string;
  prenom: string;
  fonction: string | null;
};

export class ModifierMonProfilUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ utilisateurRepository }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async run(
    utilisateurId: string,
    input: ModifierMonProfilInput,
  ): Promise<void> {
    await this.utilisateurRepository.modifierProfil(utilisateurId, {
      nom: input.nom,
      prenom: input.prenom,
      fonction: input.fonction,
    });
  }
}
