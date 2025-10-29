import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";

export const modifierEtatFichesInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
  readOnly: z.boolean(),
});

export type ModifierEtatFichesInstructionCommand = z.infer<
  typeof modifierEtatFichesInstructionCommandSchema
>;

export class ModifierEtatFichesInstructionHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: ModifierEtatFichesInstructionCommand): Promise<void> {
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
          type: $Enums.etape_evaluation_enum.INSTRUCTION,
        },
        data: {
          read_only: command.readOnly,
        },
      });
    });
  }
}
