import { z } from "zod";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";

export const enregisterBrouillonCommandSchema = z.object({
  ficheEvaluationId: z.string(),
  evaluationsCriteres: z
    .object({
      id: z.string(),
      critereId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
    })
    .array(),
  evaluationsObjectifs: z
    .object({
      id: z.string(),
      objectifId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
    })
    .array(),
});

export class EnregistrerBrouillonAutoEvaluationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    command: z.infer<typeof enregisterBrouillonCommandSchema>,
    auteurId: string,
  ) {
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
        data: { updated_at: new Date() },
      });

      for (const evaluationObjectif of command.evaluationsObjectifs) {
        const fields = {
          etape_evaluation_id: etape.id,
          id: evaluationObjectif.id,
          auteur_id: auteurId,
          objectif_id: evaluationObjectif.objectifId,
          note: evaluationObjectif.note,
          commentaire: evaluationObjectif.commentaire,
        };
        await prisma.evaluation_objectif.upsert({
          where: { id: evaluationObjectif.id },
          create: fields,
          update: fields,
        });
      }

      for (const evaluationCritere of command.evaluationsCriteres) {
        const fields = {
          etape_evaluation_id: etape.id,
          id: evaluationCritere.id,
          auteur_id: auteurId,
          critere_id: evaluationCritere.critereId,
          note: evaluationCritere.note,
          commentaire: evaluationCritere.commentaire,
        };
        await prisma.evaluation_critere.upsert({
          where: { id: evaluationCritere.id },
          create: fields,
          update: fields,
        });
      }
    });
  }
}
