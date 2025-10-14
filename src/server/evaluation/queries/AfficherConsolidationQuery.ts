import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ConsolidationData = Awaited<
  ReturnType<AfficherConsolidationQuery["run"]>
>;

export class AfficherConsolidationQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({ utilisateurId }: { utilisateurId: string }) {
    const [rattachements, tousCriteres] = await Promise.all([
      this.fetchRattachements(utilisateurId),
      this.fetchCriteres(),
    ]);

    return rattachements.map((rattachement) => {
      const evaluations = rattachement.fiche_evaluation.flatMap(
        (fiche) => fiche.etape_evaluations,
      );

      const objectifsAvecEvaluations = rattachement.objectifs.map(
        (objectif) => {
          const evaluation = evaluations
            .flatMap((etape) => etape.evaluations_objectifs)
            .find(
              (evaluationObjectif) =>
                evaluationObjectif.objectif_id === objectif.id,
            );

          return {
            id: objectif.id,
            libelle: objectif.libelle,
            evaluation: {
              id: evaluation?.id ?? randomUUID(),
              note: evaluation?.note ?? null,
              commentaire: evaluation?.commentaire ?? "",
            },
          };
        },
      );

      const criteresAvecEvaluations = tousCriteres.map((critere) => {
        const evaluation = evaluations
          .flatMap((etape) => etape.evaluations_criteres)
          .find((e) => e.critere_id === critere.id);

        return {
          id: critere.id,
          libelle: critere.libelle,
          evaluation: {
            id: evaluation?.id ?? randomUUID(),
            note: evaluation?.note ?? null,
            commentaire: evaluation?.commentaire ?? "",
          },
        };
      });

      return {
        code: rattachement.code,
        libelle: rattachement.libelle,
        objectifs: objectifsAvecEvaluations,
        criteres: criteresAvecEvaluations,
      };
    });
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
                  type: $Enums.etape_evaluation_enum.CONSOLIDATION,
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
}
