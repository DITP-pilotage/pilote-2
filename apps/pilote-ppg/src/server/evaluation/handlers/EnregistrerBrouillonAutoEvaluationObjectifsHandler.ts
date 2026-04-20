import { $Enums } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";
import { EnregistrerEvaluationService } from "@/server/evaluation/services/EnregistrerEvaluationService";
import type { Inject } from "@/server/evaluation/module";

export const enregistrerEvaluationObjectifsCommandSchema = z.object({
  ficheEvaluationId: z.string(),
  evaluationsObjectifs: z
    .object({
      id: z.string(),
      objectifId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
      annexe: z.string(),
    })
    .array(),
});

export type EnregistrerEvaluationObjectifsCommandSchema = z.infer<
  typeof enregistrerEvaluationObjectifsCommandSchema
>;

export class EnregistrerBrouillonAutoEvaluationObjectifsHandler {
  private readonly transaction: Transaction;
  private readonly prisma: PrismaPilote;

  constructor({ transaction, prisma }: Inject<"transaction" | "prisma">) {
    this.transaction = transaction;
    this.prisma = prisma;
  }

  async execute(
    command: EnregistrerEvaluationObjectifsCommandSchema,
    auteurId: string,
  ) {
    await new EnregistrerEvaluationService({
      transaction: this.transaction,
      prisma: this.prisma,
    }).enregister({
      command: {
        ficheEvaluationId: command.ficheEvaluationId,
        evaluationsObjectifs: command.evaluationsObjectifs,
        evaluationsCriteres: [],
      },
      auteurId,
      etapeCourante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    });
  }
}
