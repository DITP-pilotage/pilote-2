import { z } from "zod";
import { Transaction } from "@/server/framework/persistence/Transaction";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import type { Inject } from "@/server/evaluation/module";

export const modifierObjectifCommandSchema = z.object({
  ficheEvaluationId: z.string(),
  objectifId: z.string(),
  descriptif: z.string().max(600),
  indicateurCible: z.string().max(600),
});

export type ModifierObjectifCommand = z.infer<
  typeof modifierObjectifCommandSchema
>;

export class ModifierObjectifHandler {
  private readonly transaction: Transaction;
  private readonly prisma: PrismaPilote;

  constructor({ transaction, prisma }: Inject<"transaction" | "prisma">) {
    this.transaction = transaction;
    this.prisma = prisma;
  }

  async execute(command: ModifierObjectifCommand): Promise<void> {
    await this.transaction.run(async () => {
      const prisma = getPrisma();

      const objectif = await prisma.referentiel_objectif.findFirst({
        where: {
          id: command.objectifId,
          rattachement: {
            fiche_evaluation: { some: { id: command.ficheEvaluationId } },
          },
        },
      });

      if (!objectif) {
        throw new NotFoundError(
          "Objectif non trouvé pour cette fiche d'évaluation",
        );
      }

      await prisma.referentiel_objectif.update({
        where: {
          id: command.objectifId,
        },
        data: {
          descriptif: command.descriptif,
          indicateur_cible: command.indicateurCible,
        },
      });
    });
  }
}
