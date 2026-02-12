import { TRPCError } from "@trpc/server";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SectionActiviteComptes } from "@/server/rapports-hebdomadaires/domain/SectionActiviteComptes";
import { SectionChantier } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";
import { Coordinateur } from "@/server/rapports-hebdomadaires/domain/Coordinateur";

type ContenuRapport = {
  coordinateur: Coordinateur;
  sectionActiviteComptes: SectionActiviteComptes;
  sectionActiviteChantiers: SectionChantier[];
};

export type RapportHebdomadaire = {
  id: string;
  periodeDebut: Date;
  periodeFin: Date;
  statutEnvoi: string;
  dateCreation: Date;
  contenuRapport: ContenuRapport;
};

export default class RecupererRapportHebdomadaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    rapportId: string,
    coordinateurId: string,
  ): Promise<RapportHebdomadaire> {
    const rapport = await this.deps.prisma
      .getInstance()
      .rapport_hebdomadaire_coordinateur.findFirst({
        where: {
          id: rapportId,
          coordinateur_id: coordinateurId,
        },
      });

    if (!rapport) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Rapport hebdomadaire non trouvé",
      });
    }

    return {
      id: rapport.id,
      periodeDebut: rapport.date_debut_periode,
      periodeFin: rapport.date_fin_periode,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
      contenuRapport: rapport.contenu_rapport as ContenuRapport,
    };
  }
}
