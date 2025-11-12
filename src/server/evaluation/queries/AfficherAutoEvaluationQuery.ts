import { $Enums } from "@prisma/client";
import pick from "lodash.pick";
import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export interface Critere {
  id: string;
  libelle: string;
  descriptif: string;
  evaluation: {
    id: string;
    note: number | null;
    commentaire: string;
  };
  sousCriteres: Array<{
    id: string;
    libelle: string;
    descriptif: string;
  }>;
}

export interface Objectif {
  id: string;
  libelle: string;
  descriptif: string;
  indicateurCible: string;
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
  objectifsValides: boolean;
  criteresValides: boolean;
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
          evaluations_criteres: true,
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
      criteres: criteres.map((critere) => {
        const evaluation = etapeAutoEvaluation.evaluations_criteres.find(
          (evaluationCritere) => evaluationCritere.critere_id === critere.id,
        );
        return {
          ...pick(critere, ["id", "libelle", "descriptif"]),
          evaluation: {
            id: evaluation?.id ?? randomUUID(),
            note: evaluation?.note ?? null,
            commentaire: evaluation?.commentaire ?? "",
          },
          sousCriteres: critere.sous_criteres.map((sousCritere) =>
            pick(sousCritere, ["id", "libelle", "descriptif"]),
          ),
        };
      }),
      objectifs:
        etapeAutoEvaluation.fiche_evaluation.rattachement.objectifs.map(
          (objectif) => {
            const evaluation = etapeAutoEvaluation.evaluations_objectifs.find(
              (evaluationObjectif) =>
                evaluationObjectif.objectif_id === objectif.id,
            );
            return {
              ...pick(objectif, ["id", "libelle", "descriptif"]),
              indicateurCible: objectif.indicateur_cible,
              evaluation: {
                id: evaluation?.id ?? randomUUID(),
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
      objectifsValides: etapeAutoEvaluation.objectifs_valides ?? false,
      criteresValides: etapeAutoEvaluation.criteres_valides ?? false,
    };
  }
}
