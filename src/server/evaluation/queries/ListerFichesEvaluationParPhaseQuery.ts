import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

interface FicheEvaluation {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
  objectifsValides: boolean;
  criteresValides: boolean;
  rattachement: {
    code: string;
    libelle: string;
  };
  objectifs: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  criteres: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  noteCollective: number | null;
}

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

      for (const etapeEvaluation of fiche.etape_evaluations) {
        if (!etapesAutorisees.has(etapeEvaluation.type)) {
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
          noteCollective:
            moyenneChantiers && moyenneChantiers.count > 0
              ? Math.round(moyenneChantiers.total / moyenneChantiers.count)
              : null,
        };

        const groupe = fiche.rattachement.groupe;
        const phase = etapeEvaluation.type;

        if (!fichesParGroupe[groupe]) {
          fichesParGroupe[groupe] = {
            [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: [],
            [$Enums.etape_evaluation_enum.CONSOLIDATION]: [],
            [$Enums.etape_evaluation_enum.INSTRUCTION]: [],
          };
        }

        if (!fichesParGroupe[groupe][phase]) {
          fichesParGroupe[groupe][phase] = [];
        }

        fichesParGroupe[groupe][phase]!.push(ficheFormatee);
      }
    }

    return fichesParGroupe;
  }
}
