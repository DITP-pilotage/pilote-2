import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import {
  ActiviteComptesGateway,
  ProfilTerritorialise,
} from "@/server/rapports-hebdomadaires/domain/ports/ActiviteComptesGateway";
import { ActiviteComptes } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

export class GestionUtilisateurActiviteComptesGateway
  implements ActiviteComptesGateway
{
  constructor(
    private readonly deps: {
      activiteComptesQuery: PrismaActiviteComptesQuery;
    },
  ) {}

  async recupererActivite(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: ProfilTerritorialise[];
  }): Promise<ActiviteComptes> {
    const evenements =
      await this.deps.activiteComptesQuery.recupererActiviteComptes(params);

    return evenements.map((evenement) => ({
      type: evenement.type,
      compte: {
        email: evenement.compte.email,
        nom: evenement.compte.nom,
        prenom: evenement.compte.prenom,
        profil: evenement.compte.profil,
        territoires: evenement.compte.territoires,
      },
      date: evenement.date,
    }));
  }
}
