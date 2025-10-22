import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";

export const debloquerFichesConsolidationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export type DebloquerFichesConsolidationCommand = z.infer<
  typeof debloquerFichesConsolidationCommandSchema
>;

export class DebloquerFichesConsolidationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: DebloquerFichesConsolidationCommand): Promise<void> {
    if (command.ficheEvaluationIds.length === 0) {
      return;
    }

    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      await prisma.etape_evaluation.updateMany({
        where: {
          fiche_evaluation_id: {
            in: command.ficheEvaluationIds,
          },
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        },
        data: {
          read_only: false,
        },
      });
    });
  }
}
