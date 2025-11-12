import { z } from "zod";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";

export const validerSaisieCriteresCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export type ValiderSaisieCriteresCommandSchema = z.infer<
  typeof validerSaisieCriteresCommandSchema
>;

export class ValiderSaisieCriteresHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: ValiderSaisieCriteresCommandSchema) {
    await this.dependencies.transaction.run(async () => {
      const prisma = this.dependencies.prisma.getInstance();

      const etape = await prisma.etape_evaluation.findFirstOrThrow({
        where: {
          fiche_evaluation: {
            id: command.ficheEvaluationId,
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      });

      await prisma.etape_evaluation.update({
        where: { id: etape.id },
        data: { criteres_valides: true },
      });
    });
  }
}
