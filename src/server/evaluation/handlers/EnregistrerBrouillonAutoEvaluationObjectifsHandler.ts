import { $Enums } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";
import { EnregistrerEvaluationService } from "@/server/evaluation/services/EnregistrerEvaluationService";

export const enregisterEvaluationObjectifsCommandSchema = z.object({
  ficheEvaluationId: z.string(),
  evaluationsObjectifs: z
    .object({
      id: z.string(),
      objectifId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
    })
    .array(),
});

export type EnregistrerEvaluationObjectifsCommandSchema = z.infer<
  typeof enregisterEvaluationObjectifsCommandSchema
>;

export class EnregistrerBrouillonAutoEvaluationObjectifsHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    command: EnregistrerEvaluationObjectifsCommandSchema,
    auteurId: string,
  ) {
    await new EnregistrerEvaluationService(this.dependencies).enregister({
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
