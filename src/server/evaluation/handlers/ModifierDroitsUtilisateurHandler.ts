import { z } from "zod";
import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";

export const modifierDroitsUtilisateurCommandSchema = z.object({
  utilisateurId: z.string().uuid(),
  jalon: z.number(),
  autoEvaluation: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  consolidation: z.object({
    rattachementCodes: z.array(z.string()),
  }),
});

export type ModifierDroitsUtilisateurCommand = z.infer<
  typeof modifierDroitsUtilisateurCommandSchema
>;

export class ModifierDroitsUtilisateurHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: ModifierDroitsUtilisateurCommand): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      await prisma.rattachement_utilisateur_etape_jalon.deleteMany({
        where: {
          utilisateur_id: command.utilisateurId,
          jalon: command.jalon,
          etape: {
            in: [
              $Enums.etape_evaluation_enum.AUTO_EVALUATION,
              $Enums.etape_evaluation_enum.CONSOLIDATION,
            ],
          },
        },
      });

      if (command.autoEvaluation.rattachementCodes.length > 0) {
        await prisma.rattachement_utilisateur_etape_jalon.createMany({
          data: command.autoEvaluation.rattachementCodes.map(
            (rattachementCode) => ({
              id: randomUUID(),
              utilisateur_id: command.utilisateurId,
              rattachement_code: rattachementCode,
              etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
              jalon: command.jalon,
            }),
          ),
        });
      }

      if (command.consolidation.rattachementCodes.length > 0) {
        await prisma.rattachement_utilisateur_etape_jalon.createMany({
          data: command.consolidation.rattachementCodes.map(
            (rattachementCode) => ({
              id: randomUUID(),
              utilisateur_id: command.utilisateurId,
              rattachement_code: rattachementCode,
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
              jalon: command.jalon,
            }),
          ),
        });
      }
    });
  }
}
