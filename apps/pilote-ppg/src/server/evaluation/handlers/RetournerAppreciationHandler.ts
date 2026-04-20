import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import type { Inject } from "@/server/evaluation/module";

export const retournerAppreciationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export type RetournerAppreciationCommand = z.infer<
  typeof retournerAppreciationCommandSchema
>;

export class RetournerAppreciationHandler {
  private readonly transaction: Transaction;
  private readonly prisma: PrismaPilote;

  constructor({ transaction, prisma }: Inject<"transaction" | "prisma">) {
    this.transaction = transaction;
    this.prisma = prisma;
  }

  async execute(command: RetournerAppreciationCommand): Promise<void> {
    if (command.ficheEvaluationIds.length === 0) {
      return;
    }

    await this.transaction.run(async () => {
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

      const fichesNonEnInstruction = fiches.filter(
        (fiche) =>
          fiche.etape_courante !== $Enums.etape_evaluation_enum.INSTRUCTION,
      );

      if (fichesNonEnInstruction.length > 0) {
        throw new Error(
          "Toutes les fiches doivent être en étape INSTRUCTION pour retourner à l'appréciation",
        );
      }

      await prisma.fiche_evaluation.updateMany({
        where: {
          id: { in: command.ficheEvaluationIds },
        },
        data: {
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        },
      });

      await prisma.etape_evaluation.updateMany({
        where: {
          fiche_evaluation_id: { in: command.ficheEvaluationIds },
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
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
