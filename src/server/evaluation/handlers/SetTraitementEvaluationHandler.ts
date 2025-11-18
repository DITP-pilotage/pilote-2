import { z } from "zod";
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
