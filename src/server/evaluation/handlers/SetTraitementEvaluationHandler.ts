import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";

export const setTraitementEvaluationCommandSchema = z.object({
  evaluationId: z.string(),
  typeEvaluation: z.enum(["OBJECTIF", "MANIERE_DE_SERVIR"]),
  statut: z.enum(["TRAITEE", "NON_TRAITEE"]),
});

export type SetTraitementEvaluationCommand = z.infer<
  typeof setTraitementEvaluationCommandSchema
>;

export class SetTraitementEvaluationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: SetTraitementEvaluationCommand): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      const evaluation =
        command.typeEvaluation === "OBJECTIF"
          ? await prisma.evaluation_objectif.findUnique({
              where: { id: command.evaluationId },
              include: {
                etape_evaluation: {
                  include: {
                    fiche_evaluation: true,
                  },
                },
              },
            })
          : await prisma.evaluation_critere.findUnique({
              where: { id: command.evaluationId },
              include: {
                etape_evaluation: {
                  include: {
                    fiche_evaluation: true,
                  },
                },
              },
            });

      if (!evaluation) {
        throw new Error("Évaluation non trouvée");
      }

      if (
        evaluation.etape_evaluation.fiche_evaluation.etape_courante !==
        $Enums.etape_evaluation_enum.CONSOLIDATION
      ) {
        throw new Error(
          "La fiche d'évaluation doit être en état CONSOLIDATION",
        );
      }

      if (evaluation.note === null) {
        throw new Error("La note de l'évaluation ne peut pas être null");
      }

      const dateTraitement = command.statut === "TRAITEE" ? new Date() : null;

      await (command.typeEvaluation === "OBJECTIF"
        ? prisma.evaluation_objectif.update({
            where: {
              id: command.evaluationId,
            },
            data: {
              date_traitement: dateTraitement,
            },
          })
        : prisma.evaluation_critere.update({
            where: {
              id: command.evaluationId,
            },
            data: {
              date_traitement: dateTraitement,
            },
          }));
    });
  }
}
