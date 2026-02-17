import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { modifierProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";

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
    private readonly deps: {
      profilUtilisateurRepository: ProfilUtilisateurRepository;
      profilModifieSideEffects: ProfilModifieSideEffects;
    },
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

    await this.deps.profilUtilisateurRepository.sauvegarder(profilModifie);

    this.deps.profilModifieSideEffects.executer(profilModifie);
  }
}
