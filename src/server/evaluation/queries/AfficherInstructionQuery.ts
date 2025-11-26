import { $Enums } from "@prisma/client";
import pick from "lodash.pick";
import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  Critere,
  Objectif,
  Rattachement,
} from "@/server/evaluation/queries/types";

type AfficherInstructionQueryResult = {
  criteres: Critere[];
  rattachements: Rattachement[];
};

export class AfficherInstructionQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async execute({
    utilisateurId,
  }: {
    utilisateurId: string;
  }): Promise<AfficherInstructionQueryResult> {
    const rattachements = await this.fetchRattachements(utilisateurId);

    const tousCriteresMap = new Map<string, Critere>();
    rattachements.forEach((rattachement) => {
      const rattachementUtilisateurEtapeJalon =
        rattachement.rattachement_utilisateur_etape_jalon.find(
          (rattachementUtilisateurEtape) =>
            rattachementUtilisateurEtape.utilisateur_id === utilisateurId &&
            rattachementUtilisateurEtape.etape ===
              $Enums.etape_evaluation_enum.INSTRUCTION,
        );

      this.fetchCriteresAccessiblesPourUnRattachement(
        rattachementUtilisateurEtapeJalon,
      ).forEach((critere) => {
        tousCriteresMap.set(critere.id, {
          ...pick(critere, ["id", "libelle", "descriptif"]),
          sousCriteres: critere.sous_criteres.map((sousCritere) =>
            pick(sousCritere, ["id", "libelle", "descriptif"]),
          ),
        });
      });
    });

    return {
      criteres: [...tousCriteresMap.values()],
      rattachements: rattachements.map((rattachement) => {
        const etapesEvaluations = rattachement.fiche_evaluation.flatMap(
          (fiche) => fiche.etape_evaluations,
        );

        const rattachementUtilisateurEtapeJalon =
          rattachement.rattachement_utilisateur_etape_jalon.find(
            (rattachementUtilisateurEtape) =>
              rattachementUtilisateurEtape.utilisateur_id === utilisateurId &&
              rattachementUtilisateurEtape.etape ===
                $Enums.etape_evaluation_enum.INSTRUCTION,
          );

        const objectifsAccessibles =
          rattachementUtilisateurEtapeJalon?.instruction_objectifs.map(
            (instructionObjectif) => instructionObjectif.objectif_id,
          ) ?? [];

        const criteresAccessibles =
          rattachementUtilisateurEtapeJalon?.instruction_criteres.map(
            (instructionCritere) => instructionCritere.critere_id,
          ) ?? [];

        const objectifsAvecEvaluations = rattachement.objectifs
          .filter((objectif) => objectifsAccessibles.includes(objectif.id))
          .map((objectif) => {
            const autoEvaluation = this.findEvaluationObjectif(
              etapesEvaluations,
              objectif.id,
              $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            );
            const consolidation = this.findEvaluationObjectif(
              etapesEvaluations,
              objectif.id,
              $Enums.etape_evaluation_enum.CONSOLIDATION,
            );
            const instruction = this.findEvaluationObjectif(
              etapesEvaluations,
              objectif.id,
              $Enums.etape_evaluation_enum.INSTRUCTION,
            );

            return {
              ...pick(objectif, ["id", "libelle", "descriptif"]),
              indicateurCible: objectif.indicateur_cible,
              tutelle: objectif.tutelle
                ? {
                    id: objectif.tutelle.id,
                    nom: objectif.tutelle.nom,
                  }
                : null,
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.INSTRUCTION,
                  evaluation: this.formatEvaluation(instruction),
                  dateTraitement: instruction?.date_traitement
                    ? new Date(instruction.date_traitement).toISOString()
                    : null,
                },
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: this.formatEvaluation(consolidation),
                  dateTraitement: consolidation?.date_traitement
                    ? new Date(consolidation.date_traitement).toISOString()
                    : null,
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: this.formatEvaluation(autoEvaluation),
                  dateTraitement: autoEvaluation?.date_traitement
                    ? new Date(autoEvaluation.date_traitement).toISOString()
                    : null,
                },
              ] satisfies Objectif["evaluations"],
            };
          });

        const tousCriteresRattachement =
          this.fetchCriteresAccessiblesPourUnRattachement(
            rattachementUtilisateurEtapeJalon,
          );

        const criteresAvecEvaluations = tousCriteresRattachement
          .filter((critere) => criteresAccessibles.includes(critere.id))
          .map((critere) => {
            const autoEvaluation = this.findEvaluationCritere(
              etapesEvaluations,
              critere.id,
              $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            );
            const consolidation = this.findEvaluationCritere(
              etapesEvaluations,
              critere.id,
              $Enums.etape_evaluation_enum.CONSOLIDATION,
            );
            const instructionEvaluation = this.findEvaluationCritere(
              etapesEvaluations,
              critere.id,
              $Enums.etape_evaluation_enum.INSTRUCTION,
            );

            return {
              id: critere.id,
              libelle: critere.libelle,
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.INSTRUCTION,
                  evaluation: this.formatEvaluation(instructionEvaluation),
                  dateTraitement: instructionEvaluation?.date_traitement
                    ? new Date(
                        instructionEvaluation.date_traitement,
                      ).toISOString()
                    : null,
                },
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: this.formatEvaluation(consolidation),
                  dateTraitement: consolidation?.date_traitement
                    ? new Date(consolidation.date_traitement).toISOString()
                    : null,
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: this.formatEvaluation(autoEvaluation),
                  dateTraitement: autoEvaluation?.date_traitement
                    ? new Date(autoEvaluation.date_traitement).toISOString()
                    : null,
                },
              ] satisfies Rattachement["criteres"][number]["evaluations"],
            };
          });

        const etapeInstruction = etapesEvaluations.find(
          (etape) => etape.type === $Enums.etape_evaluation_enum.INSTRUCTION,
        );

        const ficheEvaluation = rattachement.fiche_evaluation[0];
        return {
          code: rattachement.code,
          libelle: rattachement.libelle,
          ficheEvaluationId: ficheEvaluation.id,
          readOnly: etapeInstruction?.read_only ?? false,
          etapeCourante: ficheEvaluation.etape_courante,
          objectifs: objectifsAvecEvaluations,
          criteres: criteresAvecEvaluations,
        };
      }),
    };
  }

  private fetchCriteresAccessiblesPourUnRattachement(
    rattachementUtilisateurEtapeJalon:
      | {
          instruction_criteres: Array<{
            critere: {
              id: string;
              libelle: string;
              descriptif: string;
              sous_criteres: Array<{
                id: string;
                libelle: string;
                descriptif: string;
              }>;
            };
          }>;
        }
      | undefined,
  ) {
    if (!rattachementUtilisateurEtapeJalon) {
      return [];
    }

    return rattachementUtilisateurEtapeJalon.instruction_criteres.map(
      (instructionCritere) => instructionCritere.critere,
    );
  }

  private fetchRattachements(utilisateurId: string) {
    return this.dependencies.prisma
      .getInstance()
      .referentiel_rattachement.findMany({
        where: {
          fiche_evaluation: {
            some: {
              etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
          },
          rattachement_utilisateur_etape_jalon: {
            some: {
              utilisateur_id: utilisateurId,
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
          },
        },
        orderBy: {
          code: "asc",
        },
        include: {
          objectifs: {
            orderBy: { libelle: "asc" },
            include: {
              tutelle: true,
            },
          },
          rattachement_utilisateur_etape_jalon: {
            where: {
              utilisateur_id: utilisateurId,
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
            include: {
              instruction_objectifs: {
                include: {
                  objectif: true,
                },
              },
              instruction_criteres: {
                include: {
                  critere: {
                    select: {
                      id: true,
                      libelle: true,
                      descriptif: true,
                      sous_criteres: true,
                    },
                  },
                },
              },
            },
          },
          fiche_evaluation: {
            where: {
              etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
            include: {
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
          },
        },
      });
  }

  private findEvaluationObjectif(
    etapeEvaluations: Array<{
      type: $Enums.etape_evaluation_enum;
      read_only: boolean;
      evaluations_objectifs: Array<{
        id: string;
        objectif_id: string;
        note: number | null;
        commentaire: string;
        date_traitement: Date | null;
      }>;
    }>,
    objectifId: string,
    etapeType: $Enums.etape_evaluation_enum,
  ) {
    return etapeEvaluations
      .filter((etape) => etape.type === etapeType)
      .flatMap((etape) => etape.evaluations_objectifs)
      .find((evaluation) => evaluation.objectif_id === objectifId);
  }

  private findEvaluationCritere(
    etapeEvaluations: Array<{
      type: $Enums.etape_evaluation_enum;
      read_only: boolean;
      evaluations_criteres: Array<{
        id: string;
        critere_id: string;
        note: number | null;
        commentaire: string;
        date_traitement: Date | null;
      }>;
    }>,
    critereId: string,
    etapeType: $Enums.etape_evaluation_enum,
  ) {
    return etapeEvaluations
      .filter((etape) => etape.type === etapeType)
      .flatMap((etape) => etape.evaluations_criteres)
      .find((evaluation) => evaluation.critere_id === critereId);
  }

  private formatEvaluation(
    evaluation:
      | {
          id: string;
          note: number | null;
          commentaire: string;
        }
      | undefined,
  ) {
    return {
      id: evaluation?.id ?? randomUUID(),
      note: evaluation?.note ?? null,
      commentaire: evaluation?.commentaire ?? "",
    };
  }
}
