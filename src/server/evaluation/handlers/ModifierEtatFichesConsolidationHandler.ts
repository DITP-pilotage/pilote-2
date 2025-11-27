import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";

export const modifierEtatFichesConsolidationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
  readOnly: z.boolean(),
});

export type ModifierEtatFichesConsolidationCommand = z.infer<
  typeof modifierEtatFichesConsolidationCommandSchema
>;

export class ModifierEtatFichesConsolidationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    command: ModifierEtatFichesConsolidationCommand,
  ): Promise<void> {
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
          read_only: command.readOnly,
        },
      });
    });
  }
}
