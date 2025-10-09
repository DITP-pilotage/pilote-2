import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export interface Rattachement {
  id: string;
  nom: string;
}

export class ListerFichesAutoEvaluationQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({ utilisateurId }: { utilisateurId: string }) {
    const fichesEvaluation = await this.dependencies.prisma
      .getInstance()
      .fiche_evaluation.findMany({
        where: {
          etape_evaluations: {
            some: { type: $Enums.etape_evaluation_enum.AUTO_EVALUATION },
          },
          rattachement: {
            rattachement_utilisateur_etape_jalon: {
              some: {
                etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                utilisateur_id: utilisateurId,
              },
            },
          },
        },
        include: { rattachement: true },
      });

    return fichesEvaluation.map((fiche) => ({
      id: fiche.id,
      etapeCourante: fiche.etape_courante,
      rattachement: {
        code: fiche.rattachement.code,
        libelle: fiche.rattachement.libelle,
      },
    }));
  }
}
