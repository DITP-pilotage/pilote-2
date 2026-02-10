import { CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import {
  Coordinateur,
  ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import { filtrerTerritoireNat } from "@/server/rapports-hebdomadaires/infrastructure/adapters/utils/territoires";

export class GestionUtilisateurCoordinateurGateway
  implements CoordinateurGateway
{
  constructor(
    private readonly deps: {
      utilisateursQuery: PrismaUtilisateursQuery;
    },
  ) {}

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
