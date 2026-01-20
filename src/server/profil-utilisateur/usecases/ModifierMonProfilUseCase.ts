import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { modifierProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";

type Dependencies = {
  profilUtilisateurRepository: ProfilUtilisateurRepository;
  profilModifieSideEffects: ProfilModifieSideEffects;
};

type ModifierMonProfilInput = {
  nom: string;
  prenom: string;
  fonction: string | null;
};

export class ModifierMonProfilUseCase {
  private readonly profilUtilisateurRepository: ProfilUtilisateurRepository;

  private readonly profilModifieSideEffects: ProfilModifieSideEffects;

  constructor({
    profilUtilisateurRepository,
    profilModifieSideEffects,
  }: Dependencies) {
    this.profilUtilisateurRepository = profilUtilisateurRepository;
    this.profilModifieSideEffects = profilModifieSideEffects;
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

    this.profilModifieSideEffects.executer(profilModifie);
  }
}
