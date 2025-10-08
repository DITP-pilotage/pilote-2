import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export interface Critere {
  id: string;
  libelle: string;
  sousCriteres: Array<{
    id: string;
    nom: string;
    evaluation: {
      id: string;
      note: number | null;
      commentaire: string;
    };
  }>;
}

export interface Objectif {
  id: string;
  libelle: string;
  evaluation: {
    id: string;
    note: number | null;
    commentaire: string;
  };
}

export type AfficherAutoEvaluationViewModel = {
  ficheEvaluationId: string;
  criteres: Critere[];
  objectifs: Objectif[];
  dateDerniereModification: string;
  readOnly: boolean;
};

export class AfficherAutoEvaluationQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    ficheEvaluationId,
  }: {
    ficheEvaluationId: string;
  }): Promise<AfficherAutoEvaluationViewModel> {
    const criteres = await this.dependencies.prisma
      .getInstance()
      .referentiel_critere.findMany({
        include: { sous_criteres: true },
      });
    const etapeAutoEvaluation = await this.dependencies.prisma
      .getInstance()
      .etape_evaluation.findFirstOrThrow({
        where: {
          fiche_evaluation_id: ficheEvaluationId,
          type: "AUTO_EVALUATION",
        },
        include: {
          evaluations_objectifs: true,
          evaluations_sous_criteres: true,
          fiche_evaluation: {
            include: {
              rattachement: {
                include: {
                  objectifs: true,
                },
              },
            },
          },
        },
      });

    return {
      ficheEvaluationId: etapeAutoEvaluation.fiche_evaluation.id,
      criteres: criteres.map((critere) => ({
        id: critere.id,
        libelle: critere.libelle,
        sousCriteres: critere.sous_criteres.map((sousCritere) => {
          const evaluation = etapeAutoEvaluation.evaluations_sous_criteres.find(
            (evaluationSousCritere) =>
              evaluationSousCritere.sous_critere_id === sousCritere.id,
          );
          return {
            id: sousCritere.id,
            nom: sousCritere.libelle,
            evaluation: {
              id: evaluation?.id ?? crypto.randomUUID(),
              note: evaluation?.note ?? null,
              commentaire: evaluation?.commentaire ?? "",
            },
          };
        }),
      })),
      objectifs:
        etapeAutoEvaluation.fiche_evaluation.rattachement.objectifs.map(
          (objectif) => {
            const evaluation = etapeAutoEvaluation.evaluations_objectifs.find(
              (evaluationObjectif) =>
                evaluationObjectif.objectif_id === objectif.id,
            );
            return {
              id: objectif.id,
              libelle: objectif.libelle,
              evaluation: {
                id: evaluation?.id ?? crypto.randomUUID(),
                note: evaluation?.note ?? null,
                commentaire: evaluation?.commentaire ?? "",
              },
            };
          },
        ),
      dateDerniereModification: etapeAutoEvaluation.updated_at.toISOString(),
      readOnly:
        etapeAutoEvaluation.fiche_evaluation.etape_courante !==
        $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    };
  }
}
