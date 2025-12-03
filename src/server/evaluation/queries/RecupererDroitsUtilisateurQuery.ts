import { PrismaPilote } from "@/server/db/PrismaPilote";

export type DroitsUtilisateur = {
  autoEvaluation: {
    rattachementCodes: string[];
  };
  consolidation: {
    rattachementCodes: string[];
  };
  instructionObjectifs: {
    rattachementCodes: string[];
  };
  instructionManiereDeServir: {
    critereCodes: string[];
  };
};

export class RecupererDroitsUtilisateurQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    utilisateurId,
    jalon,
  }: {
    utilisateurId: string;
    jalon: number;
  }): Promise<DroitsUtilisateur> {
    const rattachements = await this.dependencies.prisma
      .getInstance()
      .rattachement_utilisateur_etape_jalon.findMany({
        where: {
          utilisateur_id: utilisateurId,
          jalon,
        },
        include: {
          instruction_criteres: {
            select: {
              critere_id: true,
            },
          },
        },
      });

    const droits: DroitsUtilisateur = {
      autoEvaluation: {
        rattachementCodes: [],
      },
      consolidation: {
        rattachementCodes: [],
      },
      instructionObjectifs: {
        rattachementCodes: [],
      },
      instructionManiereDeServir: {
        critereCodes: [],
      },
    };

    for (const rattachement of rattachements) {
      switch (rattachement.etape) {
        case "AUTO_EVALUATION":
          droits.autoEvaluation.rattachementCodes.push(
            rattachement.rattachement_code,
          );
          break;
        case "CONSOLIDATION":
          droits.consolidation.rattachementCodes.push(
            rattachement.rattachement_code,
          );
          break;
        case "INSTRUCTION":
          droits.instructionObjectifs.rattachementCodes.push(
            rattachement.rattachement_code,
          );
          for (const instructionCritere of rattachement.instruction_criteres) {
            if (
              !droits.instructionManiereDeServir.critereCodes.includes(
                instructionCritere.critere_id,
              )
            ) {
              droits.instructionManiereDeServir.critereCodes.push(
                instructionCritere.critere_id,
              );
            }
          }
          break;
      }
    }

    return droits;
  }
}
