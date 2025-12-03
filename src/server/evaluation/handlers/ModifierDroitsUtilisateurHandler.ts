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
  instructionManiereDeServir: z.object({
    critereCodes: z.array(z.string()),
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
              $Enums.etape_evaluation_enum.INSTRUCTION,
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

      if (command.instructionManiereDeServir.critereCodes.length > 0) {
        const tousLesRattachements =
          await prisma.referentiel_rattachement.findMany({
            select: { code: true },
          });

        const rattachementsCreés =
          await prisma.rattachement_utilisateur_etape_jalon.createManyAndReturn(
            {
              data: tousLesRattachements.map((rattachement) => ({
                id: randomUUID(),
                utilisateur_id: command.utilisateurId,
                rattachement_code: rattachement.code,
                etape: $Enums.etape_evaluation_enum.INSTRUCTION,
                jalon: command.jalon,
              })),
            },
          );

        const critèresÀCréer = rattachementsCreés.flatMap((rattachement) =>
          command.instructionManiereDeServir.critereCodes.map((critereId) => ({
            id: randomUUID(),
            rattachement_utilisateur_etape_jalon_id: rattachement.id,
            critere_id: critereId,
          })),
        );

        if (critèresÀCréer.length > 0) {
          await prisma.instruction_critere.createMany({
            data: critèresÀCréer,
          });
        }
      }
    });
  }
}
