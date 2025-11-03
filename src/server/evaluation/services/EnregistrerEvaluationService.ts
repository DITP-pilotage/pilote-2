import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

export const enregistrerEvaluationCommandSchema = z.object({
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

export type EnregistrerEvaluationCommandSchema = z.infer<
  typeof enregistrerEvaluationCommandSchema
>;

export class EnregistrerEvaluationService {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async enregister({
    command,
    auteurId,
    etapeCourante,
  }: {
    command: EnregistrerEvaluationCommandSchema;
    auteurId: string;
    etapeCourante: $Enums.etape_evaluation_enum;
  }) {
    await this.dependencies.transaction.run(async () => {
      const prisma = this.dependencies.prisma.getInstance();
      const etape = await prisma.etape_evaluation.findFirstOrThrow({
        where: {
          fiche_evaluation: {
            id: command.ficheEvaluationId,
            etape_courante: etapeCourante,
          },
          type: etapeCourante,
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
          annexe: SanitizerHTML.sanitize(evaluationObjectif.annexe),
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
          annexe: SanitizerHTML.sanitize(evaluationCritere.annexe),
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
