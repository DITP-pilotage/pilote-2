import {
  type ActiviteComptesGateway,
  type ProfilTerritorialise,
} from "@/server/rapports-hebdomadaires/domain/ports/ActiviteComptesGateway";
import { type ActiviteComptes } from "@/server/rapports-hebdomadaires/domain/CompteActivite";
import type { Inject } from "@/server/rapports-hebdomadaires/module";

export class GestionUtilisateurActiviteComptesGateway implements ActiviteComptesGateway {
  constructor(private readonly deps: Inject<"activiteComptesQuery">) {}

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
