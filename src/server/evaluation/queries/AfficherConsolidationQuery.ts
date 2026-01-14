import { $Enums } from "@prisma/client";
import pick from "lodash.pick";
import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  Critere,
  Evaluation,
  Objectif,
  Rattachement,
} from "@/server/evaluation/queries/types";

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
        ...pick(critere, ["id", "libelle", "descriptif", "type"]),
        sousCriteres: critere.sous_criteres.map((sousCritere) =>
          pick(sousCritere, ["id", "libelle", "descriptif"]),
        ),
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
            return {
              ...pick(objectif, ["id", "libelle", "descriptif"]),
              indicateurCible: objectif.indicateur_cible,
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: this.formatEvaluation(consolidationEvaluation),
                  dateTraitement: consolidationEvaluation?.date_traitement
                    ? new Date(
                        consolidationEvaluation.date_traitement,
                      ).toISOString()
                    : null,
                },
              ] satisfies Objectif["evaluations"],
            };
          },
        );

        const criteresAvecEvaluations = tousCriteres.map((critere) => {
          const consolidationEvaluation = this.findEvaluationCritere(
            etapesEvaluations,
            critere.id,
            $Enums.etape_evaluation_enum.CONSOLIDATION,
          );

          return {
            ...pick(critere, ["id", "libelle", "descriptif"]),
            evaluations: [
              {
                etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                evaluation: this.formatEvaluation(consolidationEvaluation),
                dateTraitement: consolidationEvaluation?.date_traitement
                  ? new Date(
                      consolidationEvaluation.date_traitement,
                    ).toISOString()
                  : null,
              },
            ] satisfies Rattachement["criteres"][number]["evaluations"],
          };
        });

        const etapeConsolidation = etapesEvaluations.find(
          (etape) => etape.type === $Enums.etape_evaluation_enum.CONSOLIDATION,
        );

        const ficheEvaluation = rattachement.fiche_evaluation[0];
        const isInstructionPhase =
          ficheEvaluation.etape_courante ===
          $Enums.etape_evaluation_enum.INSTRUCTION;

        return {
          code: rattachement.code,
          libelle: rattachement.libelle,
          ficheEvaluationId: ficheEvaluation.id,
          dateDerniereModification:
            etapeConsolidation?.updated_at.toISOString() ?? null,
          readOnly: isInstructionPhase
            ? true
            : (etapeConsolidation?.read_only ?? false),
          etapeCourante: ficheEvaluation.etape_courante,
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
        orderBy: { libelle: "asc" },
        where: {
          fiche_evaluation: {
            some: {
              etape_courante: {
                in: [
                  $Enums.etape_evaluation_enum.CONSOLIDATION,
                  $Enums.etape_evaluation_enum.INSTRUCTION,
                ],
              },
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
              etape_courante: {
                in: [
                  $Enums.etape_evaluation_enum.CONSOLIDATION,
                  $Enums.etape_evaluation_enum.INSTRUCTION,
                ],
              },
            },
            include: {
              etape_evaluations: {
                where: {
                  type: {
                    in: [$Enums.etape_evaluation_enum.CONSOLIDATION],
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
        annexe: string;
        date_traitement: Date | null;
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
        annexe: string;
        date_traitement: Date | null;
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
      | {
          id: string;
          note: number | null;
          commentaire: string;
          annexe: string;
        }
      | undefined,
  ): Evaluation {
    return {
      id: evaluation?.id ?? randomUUID(),
      note: evaluation?.note ?? null,
      commentaire: evaluation?.commentaire ?? "",
      annexe: evaluation?.annexe ?? "",
    };
  }
}
