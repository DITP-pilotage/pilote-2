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
  instructionObjectifs: z.object({
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

      const aDesObjectifs =
        command.instructionObjectifs.rattachementCodes.length > 0;
      const aDesCriteres =
        command.instructionManiereDeServir.critereCodes.length > 0;

      if (aDesObjectifs || aDesCriteres) {
        let rattachementCodesACreer: string[] = [];

        if (aDesObjectifs && !aDesCriteres) {
          rattachementCodesACreer =
            command.instructionObjectifs.rattachementCodes;
        } else if (aDesCriteres) {
          const tousLesRattachements =
            await prisma.referentiel_rattachement.findMany({
              select: { code: true },
            });
          rattachementCodesACreer = tousLesRattachements.map((r) => r.code);
        }

        const rattachementsEtapeCrees =
          await prisma.rattachement_utilisateur_etape_jalon.createManyAndReturn(
            {
              data: rattachementCodesACreer.map((code) => ({
                id: randomUUID(),
                utilisateur_id: command.utilisateurId,
                rattachement_code: code,
                etape: $Enums.etape_evaluation_enum.INSTRUCTION,
                jalon: command.jalon,
              })),
            },
          );

        const objectifsParRattachement =
          await prisma.referentiel_objectif.findMany({
            where: {
              jalon: command.jalon,
              rattachement_code: {
                in: rattachementCodesACreer,
              },
            },
            select: {
              id: true,
              rattachement_code: true,
            },
          });

        const objectifsACreer = rattachementsEtapeCrees
          .filter((rattachement) =>
            command.instructionObjectifs.rattachementCodes.includes(
              rattachement.rattachement_code,
            ),
          )
          .flatMap((rattachement) => {
            const objectifsDuRattachement = objectifsParRattachement.filter(
              (objectif) =>
                objectif.rattachement_code === rattachement.rattachement_code,
            );
            return objectifsDuRattachement.map((objectif) => ({
              id: randomUUID(),
              rattachement_utilisateur_etape_jalon_id: rattachement.id,
              objectif_id: objectif.id,
            }));
          });

        if (objectifsACreer.length > 0) {
          await prisma.instruction_objectif.createMany({
            data: objectifsACreer,
          });
        }

        if (aDesCriteres) {
          const criteresACreer = rattachementsEtapeCrees.flatMap(
            (rattachementEtape) =>
              command.instructionManiereDeServir.critereCodes.map(
                (critereId) => ({
                  id: randomUUID(),
                  rattachement_utilisateur_etape_jalon_id: rattachementEtape.id,
                  critere_id: critereId,
                }),
              ),
          );

          await prisma.instruction_critere.createMany({
            data: criteresACreer,
          });
        }
      }
    });
  }
}
