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

    const contenuRapport = contenuRapportSchema.parse(rapport.contenu_rapport);

    contenuRapport.sectionActiviteChantiers.sort((chantier1, chantier2) =>
      chantier1.id.localeCompare(chantier2.id, "fr"),
    );

    for (const chantier of contenuRapport.sectionActiviteChantiers) {
      chantier.indicateurs.sort((indicateur1, indicateur2) =>
        indicateur1.id.localeCompare(indicateur2.id, "fr"),
      );
    }

    return {
      id: rapport.id,
      periodeDebut: rapport.date_debut_periode,
      periodeFin: rapport.date_fin_periode,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
      contenuRapport,
    };
  }
}
