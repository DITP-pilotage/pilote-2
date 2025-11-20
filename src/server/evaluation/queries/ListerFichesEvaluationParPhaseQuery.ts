import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";

type FichesParPhase = Record<$Enums.etape_evaluation_enum, FicheEvaluation[]>;
type FichesParGroupe = Record<string, FichesParPhase>;

export class ListerFichesEvaluationParPhaseQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    utilisateurId,
  }: {
    utilisateurId: string;
  }): Promise<FichesParGroupe> {
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

    const tousLesCriteres = await this.dependencies.prisma
      .getInstance()
      .referentiel_critere.findMany();

    const tousLesRattachements = await this.dependencies.prisma
      .getInstance()
      .referentiel_rattachement.findMany({
        select: {
          code: true,
          libelle: true,
        },
      });

    const mapCodeVersLibelle = new Map(
      tousLesRattachements.map((rattachement) => [
        rattachement.code,
        rattachement.libelle,
      ]),
    );

    const fichesEvaluation = await this.dependencies.prisma
      .getInstance()
      .fiche_evaluation.findMany({
        orderBy: {
          rattachement: {
            ordre: "asc",
          },
        },
        where: {
          rattachement: {
            rattachement_utilisateur_etape_jalon: {
              some: {
                utilisateur_id: utilisateurId,
              },
            },
          },
        },
        include: {
          rattachement: {
            include: {
              objectifs: true,
              rattachement_utilisateur_etape_jalon: {
                where: {
                  utilisateur_id: utilisateurId,
                },
              },
            },
          },
          etape_evaluations: {
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

    const fichesParGroupe: FichesParGroupe = {};

    for (const fiche of fichesEvaluation) {
      const permissionsUtilisateur =
        fiche.rattachement.rattachement_utilisateur_etape_jalon;
      const etapesAutorisees = new Set(
        permissionsUtilisateur.map((perm) => perm.etape),
      );

      const moyennesObjectifsParPhase: Partial<
        Record<$Enums.etape_evaluation_enum, number | null>
      > = {};

      const moyennesCriteresParPhase: Partial<
        Record<$Enums.etape_evaluation_enum, number | null>
      > = {};

      for (const etape of fiche.etape_evaluations) {
        const objectifsParEtape = fiche.rattachement.objectifs.map(
          (objectif) => {
            const evaluation = etape.evaluations_objectifs.find(
              (evalObjectif) => evalObjectif.objectif_id === objectif.id,
            );
            return {
              note: evaluation?.note ?? null,
            };
          },
        );

        const criteresParEtape = tousLesCriteres.map((critere) => {
          const evaluation = etape.evaluations_criteres.find(
            (evalCritere) => evalCritere.critere_id === critere.id,
          );
          return {
            note: evaluation?.note ?? null,
          };
        });

        const moyenneObjectifsEtape =
          objectifsParEtape.length > 0
            ? objectifsParEtape.reduce(
                (acc, obj) => ({
                  total: acc.total + (obj.note ?? 0),
                  count: acc.count + (obj.note !== null ? 1 : 0),
                }),
                { total: 0, count: 0 },
              )
            : null;

        const moyenneCriteresEtape =
          criteresParEtape.length > 0
            ? criteresParEtape.reduce(
                (acc, crit) => ({
                  total: acc.total + (crit.note ?? 0),
                  count: acc.count + (crit.note !== null ? 1 : 0),
                }),
                { total: 0, count: 0 },
              )
            : null;

        moyennesObjectifsParPhase[etape.type] =
          moyenneObjectifsEtape && moyenneObjectifsEtape.count > 0
            ? Math.round(
                moyenneObjectifsEtape.total / moyenneObjectifsEtape.count,
              )
            : null;

        moyennesCriteresParPhase[etape.type] =
          moyenneCriteresEtape && moyenneCriteresEtape.count > 0
            ? Math.round(
                moyenneCriteresEtape.total / moyenneCriteresEtape.count,
              )
            : null;
      }

      for (const etapeEvaluation of fiche.etape_evaluations) {
        if (!etapesAutorisees.has(etapeEvaluation.type)) {
          continue;
        }

        if (etapeEvaluation.type !== fiche.etape_courante) {
          continue;
        }

        const objectifsAvecNotes = fiche.rattachement.objectifs.map(
          (objectif) => {
            const evaluation = etapeEvaluation.evaluations_objectifs.find(
              (evalObjectif) => evalObjectif.objectif_id === objectif.id,
            );
            return {
              note: evaluation?.note ?? null,
            };
          },
        );

        const criteresAvecNotes = tousLesCriteres.map((critere) => {
          const evaluation = etapeEvaluation.evaluations_criteres.find(
            (evalCritere) => evalCritere.critere_id === critere.id,
          );
          return {
            note: evaluation?.note ?? null,
          };
        });

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

        const chantiersNoteCollective = fiche.chantiers_evaluation;
        const moyenneChantiers =
          chantiersNoteCollective.length > 0
            ? chantiersNoteCollective.reduce(
                (acc, chantier) => ({
                  total: acc.total + (chantier.taux_avancement ?? 0),
                  count:
                    acc.count + (chantier.taux_avancement !== null ? 1 : 0),
                }),
                { total: 0, count: 0 },
              )
            : null;

        const ficheFormatee: FicheEvaluation = {
          id: fiche.id,
          etapeCourante: fiche.etape_courante,
          objectifsValides: etapeEvaluation.objectifs_valides ?? false,
          criteresValides: etapeEvaluation.criteres_valides ?? false,
          rattachement: {
            code: fiche.rattachement.code,
            libelle: fiche.rattachement.libelle,
          },
          objectifs: {
            moyenne:
              moyenneObjectifs && moyenneObjectifs.count > 0
                ? Math.round(moyenneObjectifs.total / moyenneObjectifs.count)
                : null,
            moyennesParPhase: moyennesObjectifsParPhase,
            nombreNotes: moyenneObjectifs?.count ?? 0,
            nombreTotal: objectifsAvecNotes.length,
          },
          criteres: {
            moyenne:
              moyenneCriteres && moyenneCriteres.count > 0
                ? Math.round(moyenneCriteres.total / moyenneCriteres.count)
                : null,
            moyennesParPhase: moyennesCriteresParPhase,
            nombreNotes: moyenneCriteres?.count ?? 0,
            nombreTotal: criteresAvecNotes.length,
          },
          noteCollective:
            moyenneChantiers && moyenneChantiers.count > 0
              ? Math.round(moyenneChantiers.total / moyenneChantiers.count)
              : null,
        };

        const codeGroupe = fiche.rattachement.groupe;
        const libelleGroupe = mapCodeVersLibelle.get(codeGroupe) ?? codeGroupe;
        const phase = etapeEvaluation.type;

        if (!fichesParGroupe[libelleGroupe]) {
          fichesParGroupe[libelleGroupe] = {
            [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: [],
            [$Enums.etape_evaluation_enum.CONSOLIDATION]: [],
            [$Enums.etape_evaluation_enum.INSTRUCTION]: [],
          };
        }

        if (!fichesParGroupe[libelleGroupe][phase]) {
          fichesParGroupe[libelleGroupe][phase] = [];
        }

        fichesParGroupe[libelleGroupe][phase]!.push(ficheFormatee);
      }
    }

    return fichesParGroupe;
  }
}
