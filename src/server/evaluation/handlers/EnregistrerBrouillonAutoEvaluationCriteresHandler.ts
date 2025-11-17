import { $Enums } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";
import { EnregistrerEvaluationService } from "@/server/evaluation/services/EnregistrerEvaluationService";

export const enregistrerEvaluationCriteresCommandSchema = z.object({
  ficheEvaluationId: z.string(),
  evaluationsCriteres: z
    .object({
      id: z.string(),
      critereId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
      annexe: z.string(),
    })
    .array(),
});

export type EnregistrerEvaluationCriteresCommandSchema = z.infer<
  typeof enregistrerEvaluationCriteresCommandSchema
>;

export class EnregistrerBrouillonAutoEvaluationCriteresHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    command: EnregistrerEvaluationCriteresCommandSchema,
    auteurId: string,
  ) {
    await new EnregistrerEvaluationService(this.dependencies).enregister({
      command: {
        ficheEvaluationId: command.ficheEvaluationId,
        evaluationsObjectifs: [],
        evaluationsCriteres: command.evaluationsCriteres,
      },
      auteurId,
      etapeCourante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    });
  }
}
