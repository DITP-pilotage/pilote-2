import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { NotificationEmailService } from "@/server/evaluation/services/NotificationEmailService";
import { formatterTitreEvaluation } from "@/components/PageAppreciation/utilsTexteEvaluation";

export const transmettreAppreciationInputSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export const transmettreAppreciationCommandSchema =
  transmettreAppreciationInputSchema.extend({
    utilisateurId: z.string(),
  });

export type TransmettreAppreciationCommand = z.infer<
  typeof transmettreAppreciationCommandSchema
>;

export class TransmettreAppreciationHandler {
  private readonly notificationEmailService: NotificationEmailService;

  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
      notificationEmailService: NotificationEmailService;
    },
  ) {
    this.notificationEmailService = dependencies.notificationEmailService;
  }

  async execute(command: TransmettreAppreciationCommand): Promise<void> {
    if (command.ficheEvaluationIds.length === 0) {
      return;
    }

    const fichesAccessibles = await this.getFichesAccessibles(
      command.utilisateurId,
      command.ficheEvaluationIds,
    );

    if (fichesAccessibles.length === 0) {
      return;
    }

    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      await prisma.etape_evaluation.updateMany({
        where: {
          fiche_evaluation_id: {
            in: fichesAccessibles,
          },
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        },
        data: {
          read_only: true,
        },
      });
    });

    const utilisateursANotifier =
      await this.getUtilisateursANotifier(fichesAccessibles);

    await this.envoieNotificiations(utilisateursANotifier).catch();
  }

  private async getFichesAccessibles(
    utilisateurId: string,
    ficheEvaluationIds: string[],
  ): Promise<string[]> {
    return this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      const rattachementsAccessibles =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
          select: {
            rattachement_code: true,
          },
        });

      const rattachementCodes = rattachementsAccessibles.map(
        (r) => r.rattachement_code,
      );

      if (rattachementCodes.length === 0) {
        return [];
      }

      const fichesAccessibles = await prisma.fiche_evaluation.findMany({
        where: {
          id: { in: ficheEvaluationIds },
          rattachement_code: { in: rattachementCodes },
        },
        select: { id: true },
      });

      return fichesAccessibles.map((fiche) => fiche.id);
    });
  }

  private async envoieNotificiations(
    utilisateursANotifier: { email: string; rattachements: string[] }[],
  ) {
    for (const utilisateur of utilisateursANotifier) {
      await this.notificationEmailService.execute({
        destinataires: [{ email: utilisateur.email }],
        templateId: 56,
        params: { listeTerritoires: utilisateur.rattachements },
      });
    }
  }

  private async getUtilisateursANotifier(ficheEvaluationIds: string[]) {
    return this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      const fichesEvaluation = await prisma.fiche_evaluation.findMany({
        where: {
          id: {
            in: ficheEvaluationIds,
          },
        },
        select: {
          rattachement_code: true,
        },
      });

      const utilisateurs = await prisma.utilisateur.findMany({
        where: {
          rattachement_utilisateur_etape_jalons: {
            some: {
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
              rattachement_code: {
                in: fichesEvaluation.map((fiche) => fiche.rattachement_code),
              },
            },
          },
        },
        select: {
          email: true,
          rattachement_utilisateur_etape_jalons: {
            where: {
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
              rattachement_code: {
                in: fichesEvaluation.map((fiche) => fiche.rattachement_code),
              },
            },
            select: {
              rattachement: {
                select: {
                  libelle: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      return utilisateurs.map((utilisateur) => ({
        email: utilisateur.email,
        rattachements: utilisateur.rattachement_utilisateur_etape_jalons.map(
          (rattachement) =>
            formatterTitreEvaluation({
              code: rattachement.rattachement.code,
              libelle: rattachement.rattachement.libelle,
            }),
        ),
      }));
    });
  }
}
