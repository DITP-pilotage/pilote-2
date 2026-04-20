import { modifierProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import type { Inject } from "@/server/profil-utilisateur/module";

type ModifierMonProfilInput = {
  nom: string;
  prenom: string;
  fonction: string | null;
  service: string | null;
  serviceAutre: string | null;
  perimetreMinisteriel: string | null;
};

export class ModifierMonProfilUseCase {
  constructor(
    private readonly deps: Inject<
      "profilUtilisateurRepository" | "profilModifieSideEffects"
    >,
  ) {}

  async run(
    utilisateurId: string,
    input: ModifierMonProfilInput,
  ): Promise<void> {
    const profil =
      await this.deps.profilUtilisateurRepository.recupererParId(utilisateurId);

    const profilModifie = modifierProfilUtilisateur(profil, {
      nom: input.nom,
      prenom: input.prenom,
      fonction: input.fonction,
      service: input.service,
      serviceAutre: input.serviceAutre,
      perimetreMinisteriel: input.perimetreMinisteriel,
    });

    await this.deps.profilUtilisateurRepository.sauvegarder({
      profil: profilModifie,
      auteurId: utilisateurId,
    });

    this.deps.profilModifieSideEffects.executer(profilModifie);
  }
}
