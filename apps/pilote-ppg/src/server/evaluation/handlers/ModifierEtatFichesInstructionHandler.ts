import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/framework/persistence/Transaction";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import type { Inject } from "@/server/evaluation/module";

export const modifierEtatFichesInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
  readOnly: z.boolean(),
});

export type ModifierEtatFichesInstructionCommand = z.infer<
  typeof modifierEtatFichesInstructionCommandSchema
>;

export class ModifierEtatFichesInstructionHandler {
  private readonly transaction: Transaction;
  private readonly prisma: PrismaPilote;

  constructor({ transaction, prisma }: Inject<"transaction" | "prisma">) {
    this.transaction = transaction;
    this.prisma = prisma;
  }

  async execute(command: ModifierEtatFichesInstructionCommand): Promise<void> {
    if (command.ficheEvaluationIds.length === 0) {
      return;
    }

    await this.transaction.run(async () => {
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
