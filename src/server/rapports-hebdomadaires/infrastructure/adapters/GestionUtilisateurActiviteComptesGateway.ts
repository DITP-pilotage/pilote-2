import {
  CompteDTO,
  EvenementCompteDTO,
  PrismaActiviteComptesQuery,
} from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import { ActiviteComptesGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteComptesGateway";
import {
  ActiviteComptes,
  CompteActivite,
} from "@/server/rapports-hebdomadaires/domain/CompteActivite";

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
    profilCodes: string[];
  }): Promise<ActiviteComptes> {
    const evenements =
      await this.deps.activiteComptesQuery.recupererActiviteComptes(params);

    return evenements.map((evt) => this.mapToEvenementCompte(evt));
  }

  private mapToEvenementCompte(
    evt: EvenementCompteDTO,
  ): ActiviteComptes[number] {
    return {
      type: evt.type,
      compte: this.mapToCompteActivite(evt.compte),
      date: evt.date,
    };
  }

  private mapToCompteActivite(compte: CompteDTO): CompteActivite {
    return {
      email: compte.email,
      nom: compte.nom,
      prenom: compte.prenom,
      profil: compte.profil,
      territoires: compte.territoires.map((t) => ({
        code: t.code,
        nom: t.nom,
      })),
    };
  }
}
