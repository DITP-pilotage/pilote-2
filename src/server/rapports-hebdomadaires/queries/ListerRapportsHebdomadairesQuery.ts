import { type $Enums } from "@prisma/client";
import type { Inject } from "@/server/rapports-hebdomadaires/module";

export type RapportHebdomadaireResume = {
  id: string;
  periodeDebut: Date;
  periodeFin: Date;
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
};

export class ListerRapportsHebdomadairesQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(coordinateurId: string): Promise<RapportHebdomadaireResume[]> {
    const rapports = await this.deps.prisma
      .getInstance()
      .rapport_hebdomadaire_coordinateur.findMany({
        where: {
          coordinateur_id: coordinateurId,
        },
        select: {
          id: true,
          date_debut_periode: true,
          date_fin_periode: true,
          statut_envoi: true,
          date_creation: true,
        },
        orderBy: {
          date_debut_periode: "desc",
        },
      });

    return rapports.map((rapport) => ({
      id: rapport.id,
      periodeDebut: rapport.date_debut_periode,
      periodeFin: rapport.date_fin_periode,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
    }));
  }
}
