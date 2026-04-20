import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/evaluation/module";

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

export type UtilisateurPiloteEval = {
  email: string;
  droitsUtilisateur: DroitsUtilisateur;
};

export class RecupererDroitsUtilisateurQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    utilisateurId,
    jalon,
  }: {
    utilisateurId: string;
    jalon: number;
  }): Promise<UtilisateurPiloteEval> {
    const utilisateur = await this.prisma.getInstance().utilisateur.findUnique({
      where: {
        id: utilisateurId,
      },
      select: {
        email: true,
      },
    });

    const rattachements = await this.prisma
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
          instruction_objectifs: {
            select: {
              objectif: {
                select: {
                  rattachement_code: true,
                },
              },
              objectif_id: true,
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
          if (rattachement.instruction_objectifs.length > 0) {
            droits.instructionObjectifs.rattachementCodes.push(
              ...new Set(
                rattachement.instruction_objectifs.map(
                  (instructionObjectif) =>
                    instructionObjectif.objectif.rattachement_code,
                ),
              ),
            );
          }
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

    return {
      email: utilisateur?.email ?? "",
      droitsUtilisateur: droits,
    };
  }
}
