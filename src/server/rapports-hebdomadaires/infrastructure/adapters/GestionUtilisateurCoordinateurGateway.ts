import { CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import {
  Coordinateur,
  ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";

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
      territoires: utilisateur.territoires.map((territoire) => ({
        code: territoire.code,
        nom: territoire.nom,
        // TODO (CHAN - Rapport) : gérer la maille NAT
        maille: territoire.maille === "REG" ? "REG" : "DEPT",
      })),
    }));
  }
}
