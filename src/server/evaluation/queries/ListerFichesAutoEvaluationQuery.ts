import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export interface Rattachement {
  id: string;
  nom: string;
}

export class ListerFichesAutoEvaluationQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({ utilisateurId }: { utilisateurId: string }) {
    const derniereDateCalcul = await this.dependencies.prisma
      .getInstance()
      .chantier_evaluation.findFirst({
        orderBy: {
          date_calcul: "desc",
        },
        select: {
          date_calcul: true,
        },
      });

    const fichesEvaluation = await this.dependencies.prisma
      .getInstance()
      .fiche_evaluation.findMany({
        where: {
          etape_evaluations: {
            some: { type: $Enums.etape_evaluation_enum.AUTO_EVALUATION },
          },
          rattachement: {
            rattachement_utilisateur_etape_jalon: {
              some: {
                etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                utilisateur_id: utilisateurId,
              },
            },
          },
        },
        include: {
          rattachement: {
            include: {
              objectifs: true,
            },
          },
          etape_evaluations: {
            where: { type: $Enums.etape_evaluation_enum.AUTO_EVALUATION },
            include: {
              evaluations_objectifs: true,
              evaluations_criteres: true,
            },
          },
          chantiers_evaluation: {
            where: derniereDateCalcul
              ? {
                  date_calcul: derniereDateCalcul.date_calcul,
                }
              : undefined,
          },
        },
      });

    return fichesEvaluation.map((fiche) => {
      const etapeAutoEvaluation = fiche.etape_evaluations[0];
      const objectifsAvecNotes = etapeAutoEvaluation
        ? fiche.rattachement.objectifs.map((objectif) => {
            const evaluation = etapeAutoEvaluation.evaluations_objectifs.find(
              (evalObjectif) => evalObjectif.objectif_id === objectif.id,
            );
            return {
              note: evaluation?.note ?? null,
            };
          })
        : [];

      const criteresAvecNotes = etapeAutoEvaluation
        ? etapeAutoEvaluation.evaluations_criteres.map((evalCritere) => ({
            note: evalCritere.note,
          }))
        : [];

      const moyenneObjectifs =
        objectifsAvecNotes.length > 0
          ? objectifsAvecNotes.reduce(
              (acc, obj) => ({
                total: acc.total + (obj.note ?? 0),
                count: acc.count + (obj.note !== null ? 1 : 0),
              }),
              { total: 0, count: 0 },
            )
          : null;

      const moyenneCriteres =
        criteresAvecNotes.length > 0
          ? criteresAvecNotes.reduce(
              (acc, crit) => ({
                total: acc.total + (crit.note ?? 0),
                count: acc.count + (crit.note !== null ? 1 : 0),
              }),
              { total: 0, count: 0 },
            )
          : null;

      const chantiersAvecTaux = fiche.chantiers_evaluation.filter(
        (chantier) => chantier.taux_avancement !== null,
      );

      const noteCollective =
        chantiersAvecTaux.length > 0
          ? Math.round(
              chantiersAvecTaux.reduce(
                (sum, chantier) => sum + chantier.taux_avancement!,
                0,
              ) / chantiersAvecTaux.length,
            )
          : null;

      return {
        id: fiche.id,
        etapeCourante: fiche.etape_courante,
        rattachement: {
          code: fiche.rattachement.code,
          libelle: fiche.rattachement.libelle,
        },
        objectifs: {
          moyenne:
            moyenneObjectifs && moyenneObjectifs.count > 0
              ? Math.round(moyenneObjectifs.total / moyenneObjectifs.count)
              : null,
          nombreNotes: moyenneObjectifs?.count ?? 0,
          nombreTotal: objectifsAvecNotes.length,
        },
        criteres: {
          moyenne:
            moyenneCriteres && moyenneCriteres.count > 0
              ? Math.round(moyenneCriteres.total / moyenneCriteres.count)
              : null,
          nombreNotes: moyenneCriteres?.count ?? 0,
          nombreTotal: criteresAvecNotes.length,
        },
        noteCollective,
      };
    });
  }
}
