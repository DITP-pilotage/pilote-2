import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";

export const retournerAutoEvaluationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export type RetournerAutoEvaluationCommand = z.infer<
  typeof retournerAutoEvaluationCommandSchema
>;

export class RetournerAutoEvaluationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: RetournerAutoEvaluationCommand): Promise<void> {
    if (command.ficheEvaluationIds.length === 0) {
      return;
    }

    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      const fiches = await prisma.fiche_evaluation.findMany({
        where: {
          id: { in: command.ficheEvaluationIds },
        },
        select: {
          id: true,
          etape_courante: true,
        },
      });

      const fichesNonEnConsolidation = fiches.filter(
        (fiche) =>
          fiche.etape_courante !== $Enums.etape_evaluation_enum.CONSOLIDATION,
      );

      if (fichesNonEnConsolidation.length > 0) {
        throw new Error(
          "Toutes les fiches doivent être en étape CONSOLIDATION pour retourner à l'auto-évaluation",
        );
      }

      await prisma.fiche_evaluation.updateMany({
        where: {
          id: { in: command.ficheEvaluationIds },
        },
        data: {
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      });

      await prisma.etape_evaluation.updateMany({
        where: {
          fiche_evaluation_id: { in: command.ficheEvaluationIds },
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
        data: {
          read_only: false,
          objectifs_valides: false,
          criteres_valides: false,
        },
      });
    });
  }
}
