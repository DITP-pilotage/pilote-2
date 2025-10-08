import { PrismaPilote } from "@/server/db/PrismaPilote";

export interface Critere {
  id: string;
  nom: string;
  sousCriteres: Array<{
    id: string;
    nom: string;
    evaluation: {
      note: number | null;
      commentaire: string;
    };
  }>;
}

export interface Objectif {
  id: string;
  nom: string;
  evaluation: {
    note: number | null;
    commentaire: string;
  };
}

export type AfficherAutoEvaluationViewModel = {
  criteres: Critere[];
  objectifs: Objectif[];
  denieresModifications: string;
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
      criteres: criteres.map((critere) => {
        return {
          id: critere.id,
          nom: critere.libelle,
          sousCriteres: critere.sous_criteres.map((sousCritere) => ({
            id: sousCritere.id,
            nom: sousCritere.libelle,
            evaluation: etapeAutoEvaluation.evaluations_sous_criteres.find(
              (evaluation) => evaluation.sous_critere_id === sousCritere.id,
            ) ?? {
              note: null,
              commentaire: "",
            },
          })),
        };
      }),
      objectifs:
        etapeAutoEvaluation.fiche_evaluation.rattachement.objectifs.map(
          (objectif) => ({
            id: objectif.id,
            nom: objectif.libelle,
            evaluation: etapeAutoEvaluation.evaluations_objectifs.find(
              (evaluation) => evaluation.objectif_id === objectif.id,
            ) ?? {
              note: null,
              commentaire: "",
            },
          }),
        ),
      denieresModifications: new Date().toISOString(),
    };
  }
}
