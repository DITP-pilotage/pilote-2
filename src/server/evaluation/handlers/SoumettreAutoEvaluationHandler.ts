import {
  $Enums,
  etape_evaluation,
  evaluation_objectif,
  evaluation_sous_critere,
} from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const soumettreAutoEvaluationCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export class SoumettreAutoEvaluationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    { ficheEvaluationId }: z.infer<typeof soumettreAutoEvaluationCommandSchema>,
    auteurId: string,
  ) {
    const etapeEvaluation = await this.getEtapeEvaluation(ficheEvaluationId);

    await this.dependencies.transaction.run(async () => {
      await this.creerEtapeConsolidation({
        auteurId,
        ficheEvaluationId,
        etapeEvaluation,
      });
      await this.setEtapeCouranteConsolidation(ficheEvaluationId);
    });
  }

  private creerEtapeConsolidation({
    auteurId,
    ficheEvaluationId,
    etapeEvaluation,
  }: {
    auteurId: string;
    ficheEvaluationId: string;
    etapeEvaluation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_sous_criteres: evaluation_sous_critere[];
    };
  }) {
    return this.prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        fiche_evaluation_id: ficheEvaluationId,
        type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        evaluations_objectifs: {
          create: etapeEvaluation.evaluations_objectifs.map((evaluation) => ({
            id: randomUUID(),
            objectif_id: evaluation.objectif_id,
            auteur_id: auteurId,
            note: evaluation.note,
            statut_evaluation: $Enums.statut_evaluation.A_VERIFIER,
            commentaire: evaluation.commentaire,
          })),
        },
        evaluations_sous_criteres: {
          create: etapeEvaluation.evaluations_sous_criteres.map(
            (evaluation) => ({
              id: randomUUID(),
              sous_critere_id: evaluation.sous_critere_id,
              auteur_id: auteurId,
              note: evaluation.note,
              statut_evaluation: $Enums.statut_evaluation.A_VERIFIER,
              commentaire: evaluation.commentaire,
            }),
          ),
        },
      },
    });
  }

  private setEtapeCouranteConsolidation(ficheEvaluationId: string) {
    return this.prisma.fiche_evaluation.update({
      where: { id: ficheEvaluationId },
      data: { etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION },
    });
  }

  private getEtapeEvaluation(ficheEvaluationId: string) {
    return this.prisma.etape_evaluation.findFirstOrThrow({
      where: {
        type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        fiche_evaluation: {
          id: ficheEvaluationId,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      },
      include: {
        evaluations_objectifs: true,
        evaluations_sous_criteres: true,
      },
    });
  }

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }
}
