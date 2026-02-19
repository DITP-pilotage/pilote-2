import { PrismaPilote } from "@/server/db/PrismaPilote";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import {
  contenuRapportSchema,
  type ContenuRapport,
} from "@/server/rapports-hebdomadaires/infrastructure/adapters/PrismaRapportRepository";

export type RapportHebdomadaire = {
  id: string;
  periodeDebut: Date;
  periodeFin: Date;
  statutEnvoi: string;
  dateCreation: Date;
  contenuRapport: ContenuRapport;
};

export class RecupererRapportHebdomadaireQuery {
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
      throw new NotFoundError("Rapport hebdomadaire non trouvé");
    }

    return {
      id: rapport.id,
      periodeDebut: rapport.date_debut_periode,
      periodeFin: rapport.date_fin_periode,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
      contenuRapport: contenuRapportSchema.parse(rapport.contenu_rapport),
    };
  }
}
