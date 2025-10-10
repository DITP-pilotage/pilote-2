import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ConsolidationData = Awaited<
  ReturnType<AfficherConsolidationQuery["run"]>
>;

export class AfficherConsolidationQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({ utilisateurId }: { utilisateurId: string }) {
    const rattachements = await this.dependencies.prisma
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
          fiche_evaluation: {
            where: {
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
            include: {
              etape_evaluations: {
                where: {
                  type: $Enums.etape_evaluation_enum.CONSOLIDATION,
                },
                include: {
                  evaluations_objectifs: {
                    include: { objectif: true },
                  },
                  evaluations_sous_criteres: {
                    include: { sous_critere: { include: { parent: true } } },
                  },
                },
              },
            },
          },
        },
      });

    return rattachements.map((rattachement) => ({
      code: rattachement.code,
      libelle: rattachement.libelle,
      objectifs: rattachement.fiche_evaluation.flatMap((ficheEvaluation) =>
        ficheEvaluation.etape_evaluations[0].evaluations_objectifs.map(
          (evaluation) => ({
            id: evaluation.objectif.id,
            libelle: evaluation.objectif.libelle,
            evaluation: {
              id: evaluation.id,
              note: evaluation.note,
              commentaire: evaluation.commentaire,
              statut_evaluation: evaluation.statut_evaluation,
            },
          }),
        ),
      ),
      sousCriteres: rattachement.fiche_evaluation.flatMap((fiche) =>
        fiche.etape_evaluations[0].evaluations_sous_criteres.map(
          (evaluation) => ({
            id: evaluation.sous_critere.id,
            critere: {
              id: evaluation.sous_critere.parent.id,
              libelle: evaluation.sous_critere.parent.libelle,
            },
            libelle: evaluation.sous_critere.libelle,
            evaluation: {
              id: evaluation.id,
              note: evaluation.note,
              commentaire: evaluation.commentaire,
              statut_evaluation: evaluation.statut_evaluation,
            },
          }),
        ),
      ),
    }));
  }
}
