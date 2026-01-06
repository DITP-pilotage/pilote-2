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
        descriptif: critere.descriptif,
        type: critere.type,
        sousCriteres: critere.sous_criteres.map((sousCritere) => ({
          id: sousCritere.id,
          libelle: sousCritere.libelle,
          descriptif: sousCritere.descriptif,
        })),
      })),
      fichesEvaluation: fichesEvaluation.map((fiche) => {
        const rattachement = fiche.rattachement;

        const noteObjectifsCollectifs = this.buldNoteObjectifsCollectifs(
          fiche.chantiers_evaluation,
        );

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

        const etapeEnCours = fiche.etape_evaluations.find(
          (etape) => etape.type === fiche.etape_courante,
        );

        return {
          id: fiche.id,
          jalon: fiche.jalon,
          etapeCourante: fiche.etape_courante,
          readOnly: etapeEnCours?.read_only ?? false,
          rattachement: {
            code: rattachement.code,
            libelle: rattachement.libelle,
            groupe: rattachement.groupe,
            ordre: rattachement.ordre,
          },
          evaluationsParCritereEtEtape,
          objectifs,
          noteObjectifsCollectifs,
        };
      }),
    };
  }

  private buldNoteObjectifsCollectifs(
    chantiersObjectifsCollectifs: {
      maille: $Enums.Maille;
      code_insee: string;
      zone_id: string;
      id: string;
      territoire_code: string;
      jalon: number;
      taux_avancement: number | null;
      date_calcul: Date;
    }[],
  ) {
    const objectifsCollectifs =
      chantiersObjectifsCollectifs.length > 0
        ? chantiersObjectifsCollectifs.reduce(
            (acc, chantier) => ({
              total: acc.total + (chantier.taux_avancement ?? 0),
              count: acc.count + (chantier.taux_avancement !== null ? 1 : 0),
            }),
            { total: 0, count: 0 },
          )
        : null;
    return objectifsCollectifs && objectifsCollectifs.count > 0
      ? Math.round(objectifsCollectifs.total / objectifsCollectifs.count)
      : null;
  }

  private fetchFichesEvaluation() {
    return this.dependencies.prisma.getInstance().fiche_evaluation.findMany({
      include: {
        rattachement: {
          include: {
            objectifs: { orderBy: { libelle: "asc" } },
          },
        },
        chantiers_evaluation: true,
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
      orderBy: [
        {
          rattachement: {
            groupe: "asc",
          },
        },
        {
          rattachement: {
            ordre: "asc",
          },
        },
      ],
    });
  }

  private fetchCriteres() {
    return this.dependencies.prisma.getInstance().referentiel_critere.findMany({
      include: { sous_criteres: true },
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
