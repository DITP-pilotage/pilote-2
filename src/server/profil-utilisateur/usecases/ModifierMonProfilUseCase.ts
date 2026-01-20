import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { modifierProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

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
    const profil =
      await this.profilUtilisateurRepository.recupererParId(utilisateurId);

    const profilModifie = modifierProfilUtilisateur(profil, {
      nom: input.nom,
      prenom: input.prenom,
      fonction: input.fonction,
    });

    await this.profilUtilisateurRepository.sauvegarder(profilModifie);
  }
}
