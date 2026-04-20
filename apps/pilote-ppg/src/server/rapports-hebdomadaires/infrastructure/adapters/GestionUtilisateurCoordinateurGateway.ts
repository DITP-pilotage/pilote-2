import { type CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import {
  type Coordinateur,
  type ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { filtrerTerritoireNat } from "@/server/rapports-hebdomadaires/infrastructure/adapters/utils/territoires";
import type { Inject } from "@/server/rapports-hebdomadaires/module";

export class GestionUtilisateurCoordinateurGateway implements CoordinateurGateway {
  constructor(private readonly deps: Inject<"utilisateursQuery">) {}

  async recupererCoordinateurs(
    profils: ProfilCoordinateur[],
  ): Promise<Coordinateur[]> {
    const utilisateurs =
      await this.deps.utilisateursQuery.recupererParProfils(profils);

    return utilisateurs.map((utilisateur) => ({
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      profil: utilisateur.profilCode as ProfilCoordinateur,
      territoires:
        utilisateur.habilitationLectureTerritoires.filter(filtrerTerritoireNat),
    }));
  }
}
