import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class AfficherPilotageQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run() {
    const [fichesEvaluation, criteres] = await Promise.all([
      this.fetchFichesEvaluation(),
      this.fetchCriteres(),
    ]);

    return {
      criteres: criteres.map((critere) => ({
        id: critere.id,
        libelle: critere.libelle,
      })),
      fichesEvaluation: fichesEvaluation.map((fiche) => {
        const rattachement = fiche.rattachement;

        const evaluationsParCritereEtEtape = this.buildEvaluationsMap(
          fiche.etape_evaluations,
          criteres.map((critere) => critere.id),
          "critere",
        );

        const objectifs = rattachement.objectifs.map((objectif) => {
          const evaluationsParEtape = this.buildEvaluationsMap(
            fiche.etape_evaluations,
            [objectif.id],
            "objectif",
          );

          return {
            id: objectif.id,
            libelle: objectif.libelle,
            evaluations: evaluationsParEtape[objectif.id] || {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          };
        });

        const etapeConsolidation = fiche.etape_evaluations.find(
          (etape) => etape.type === $Enums.etape_evaluation_enum.CONSOLIDATION,
        );

        return {
          id: fiche.id,
          jalon: fiche.jalon,
          etapeCourante: fiche.etape_courante,
          readOnly: etapeConsolidation?.read_only ?? false,
          rattachement: {
            code: rattachement.code,
            libelle: rattachement.libelle,
          },
          evaluationsParCritereEtEtape,
          objectifs,
        };
      }),
    };
  }

  private fetchFichesEvaluation() {
    return this.dependencies.prisma.getInstance().fiche_evaluation.findMany({
      include: {
        rattachement: {
          include: {
            objectifs: { orderBy: { libelle: "asc" } },
          },
        },
        etape_evaluations: {
          where: {
            type: {
              in: [
                $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                $Enums.etape_evaluation_enum.CONSOLIDATION,
                $Enums.etape_evaluation_enum.INSTRUCTION,
              ],
            },
          },
          include: {
            evaluations_objectifs: true,
            evaluations_criteres: true,
          },
        },
      },
      orderBy: {
        rattachement: {
          code: "asc",
        },
      },
    });
  }

  private fetchCriteres() {
    return this.dependencies.prisma.getInstance().referentiel_critere.findMany({
      orderBy: { libelle: "asc" },
    });
  }

  private buildEvaluationsMap(
    etapeEvaluations: Array<{
      type: $Enums.etape_evaluation_enum;
      read_only: boolean;
      evaluations_objectifs: Array<{
        objectif_id: string;
        note: number | null;
      }>;
      evaluations_criteres: Array<{
        critere_id: string;
        note: number | null;
      }>;
    }>,
    ids: string[],
    type: "critere" | "objectif",
  ): Record<string, Record<$Enums.etape_evaluation_enum, number | null>> {
    const map: Record<
      string,
      Record<$Enums.etape_evaluation_enum, number | null>
    > = {};

    ids.forEach((id) => {
      map[id] = {
        AUTO_EVALUATION: null,
        CONSOLIDATION: null,
        INSTRUCTION: null,
      };
    });

    etapeEvaluations.forEach((etape) => {
      const evaluations =
        type === "critere"
          ? etape.evaluations_criteres
          : etape.evaluations_objectifs;

      evaluations.forEach((evaluation) => {
        const itemId =
          type === "critere"
            ? (evaluation as { critere_id: string }).critere_id
            : (evaluation as { objectif_id: string }).objectif_id;

        if (map[itemId]) {
          map[itemId][etape.type] = evaluation.note;
        }
      });
    });

    return map;
  }
}
