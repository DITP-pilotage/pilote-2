import {
  $Enums,
  etape_evaluation,
  evaluation_objectif,
  evaluation_critere,
} from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const passerALEtapeInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALEtapeInstructionHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    {
      ficheEvaluationIds,
    }: z.infer<typeof passerALEtapeInstructionCommandSchema>,
    auteurId: string,
  ) {
    await this.dependencies.transaction.run(async () => {
      for (const ficheEvaluationId of ficheEvaluationIds) {
        const etapeEvaluation =
          await this.getEtapeConsolidation(ficheEvaluationId);

        await this.creerEtapeInstruction({
          auteurId,
          ficheEvaluationId,
          etapeEvaluation,
        });
        await this.setEtapeCouranteInstruction(ficheEvaluationId);
      }
    });
  }

  private creerEtapeInstruction({
    auteurId,
    ficheEvaluationId,
    etapeEvaluation,
  }: {
    auteurId: string;
    ficheEvaluationId: string;
    etapeEvaluation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
  }) {
    return this.prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        fiche_evaluation_id: ficheEvaluationId,
        type: $Enums.etape_evaluation_enum.INSTRUCTION,
        evaluations_objectifs: {
          create: etapeEvaluation.evaluations_objectifs.map((evaluation) => ({
            id: randomUUID(),
            objectif_id: evaluation.objectif_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          })),
        },
        evaluations_criteres: {
          create: etapeEvaluation.evaluations_criteres.map((evaluation) => ({
            id: randomUUID(),
            critere_id: evaluation.critere_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          })),
        },
      },
    });
  }

  private setEtapeCouranteInstruction(ficheEvaluationId: string) {
    return this.prisma.fiche_evaluation.update({
      where: { id: ficheEvaluationId },
      data: { etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION },
    });
  }

  private getEtapeConsolidation(ficheEvaluationId: string) {
    return this.prisma.etape_evaluation.findFirstOrThrow({
      where: {
        type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        fiche_evaluation: {
          id: ficheEvaluationId,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        },
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }
}
