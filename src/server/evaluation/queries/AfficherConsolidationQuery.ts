import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Critere, Rattachement } from "@/server/evaluation/queries/types";

type AfficherConsolidationQueryResult = {
  criteres: Critere[];
  rattachements: Rattachement[];
};

export class AfficherConsolidationQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    utilisateurId,
  }: {
    utilisateurId: string;
  }): Promise<AfficherConsolidationQueryResult> {
    const [rattachements, tousCriteres] = await Promise.all([
      this.fetchRattachements(utilisateurId),
      this.fetchCriteres(),
    ]);

    return {
      criteres: tousCriteres.map((critere) => ({
        id: critere.id,
        libelle: critere.libelle,
      })),
      rattachements: rattachements.map((rattachement) => {
        const etapesEvaluations = rattachement.fiche_evaluation.flatMap(
          (fiche) => fiche.etape_evaluations,
        );

        const objectifsAvecEvaluations = rattachement.objectifs.map(
          (objectif) => {
            const consolidationEvaluation = this.findEvaluationObjectif(
              etapesEvaluations,
              objectif.id,
              $Enums.etape_evaluation_enum.CONSOLIDATION,
            );
            const autoEvaluation = this.findEvaluationObjectif(
              etapesEvaluations,
              objectif.id,
              $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            );

            return {
              id: objectif.id,
              libelle: objectif.libelle,
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: this.formatEvaluation(consolidationEvaluation),
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: this.formatEvaluation(autoEvaluation),
                },
              ],
            };
          },
        );

        const criteresAvecEvaluations = tousCriteres.map((critere) => {
          const consolidationEvaluation = this.findEvaluationCritere(
            etapesEvaluations,
            critere.id,
            $Enums.etape_evaluation_enum.CONSOLIDATION,
          );
          const autoEvaluation = this.findEvaluationCritere(
            etapesEvaluations,
            critere.id,
            $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          );

          return {
            id: critere.id,
            libelle: critere.libelle,
            evaluations: [
              {
                etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                evaluation: this.formatEvaluation(consolidationEvaluation),
              },
              {
                etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                evaluation: this.formatEvaluation(autoEvaluation),
              },
            ],
          };
        });

        const etapeConsolidation = etapesEvaluations.find(
          (etape) => etape.type === $Enums.etape_evaluation_enum.CONSOLIDATION,
        );

        return {
          code: rattachement.code,
          libelle: rattachement.libelle,
          ficheEvaluationId: rattachement.fiche_evaluation[0].id,
          readOnly: etapeConsolidation?.read_only ?? false,
          objectifs: objectifsAvecEvaluations,
          criteres: criteresAvecEvaluations,
        };
      }),
    };
  }

  private fetchCriteres() {
    return this.dependencies.prisma.getInstance().referentiel_critere.findMany({
      orderBy: { libelle: "asc" },
      include: { sous_criteres: true },
    });
  }

  private fetchRattachements(utilisateurId: string) {
    return this.dependencies.prisma
      .getInstance()
      .referentiel_rattachement.findMany({
        where: {
          fiche_evaluation: {
            some: {
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
          },
          rattachement_utilisateur_etape_jalon: {
            some: {
              utilisateur_id: utilisateurId,
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
          },
        },
        include: {
          objectifs: { orderBy: { libelle: "asc" } },
          fiche_evaluation: {
            where: {
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
            include: {
              etape_evaluations: {
                where: {
                  type: {
                    in: [
                      $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                      $Enums.etape_evaluation_enum.CONSOLIDATION,
                    ],
                  },
                },
                include: {
                  evaluations_objectifs: true,
                  evaluations_criteres: true,
                },
              },
            },
          },
        },
      });
  }

  private findEvaluationObjectif(
    etapeEvaluations: Array<{
      type: $Enums.etape_evaluation_enum;
      read_only: boolean;
      evaluations_objectifs: Array<{
        id: string;
        objectif_id: string;
        note: number | null;
        commentaire: string;
      }>;
    }>,
    objectifId: string,
    etapeType: $Enums.etape_evaluation_enum,
  ) {
    return etapeEvaluations
      .filter((etape) => etape.type === etapeType)
      .flatMap((etape) => etape.evaluations_objectifs)
      .find((evaluation) => evaluation.objectif_id === objectifId);
  }

  private findEvaluationCritere(
    etapeEvaluations: Array<{
      type: $Enums.etape_evaluation_enum;
      read_only: boolean;
      evaluations_criteres: Array<{
        id: string;
        critere_id: string;
        note: number | null;
        commentaire: string;
      }>;
    }>,
    critereId: string,
    etapeType: $Enums.etape_evaluation_enum,
  ) {
    return etapeEvaluations
      .filter((etape) => etape.type === etapeType)
      .flatMap((etape) => etape.evaluations_criteres)
      .find((evaluation) => evaluation.critere_id === critereId);
  }

  private formatEvaluation(
    evaluation:
      | { id: string; note: number | null; commentaire: string }
      | undefined,
  ) {
    return {
      id: evaluation?.id ?? randomUUID(),
      note: evaluation?.note ?? null,
      commentaire: evaluation?.commentaire ?? "",
    };
  }
}
