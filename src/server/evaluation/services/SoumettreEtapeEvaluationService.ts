import {
  $Enums,
  etape_evaluation,
  evaluation_objectif,
  evaluation_critere,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class SoumettreEtapeEvaluationService {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute({
    ficheEvaluationId,
    auteurId,
  }: {
    ficheEvaluationId: string;
    auteurId: string;
  }) {
    const etapeAutoEvaluation =
      await this.getEtapeAutoEvaluation(ficheEvaluationId);

    await this.dependencies.transaction.run(async () => {
      const existingConsolidation =
        await this.getExistingConsolidation(ficheEvaluationId);

      if (!existingConsolidation) {
        await this.creerEtapeConsolidation({
          auteurId,
          ficheEvaluationId,
          etapeAutoEvaluation,
        });
      } else {
        await this.mettreAJourConsolidationExistante({
          etapeAutoEvaluation,
          consolidation: existingConsolidation,
        });
      }

      await this.setEtapeCouranteConsolidation(ficheEvaluationId);
    });
  }

  private async mettreAJourConsolidationExistante({
    etapeAutoEvaluation,
    consolidation,
  }: {
    etapeAutoEvaluation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
    consolidation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
  }) {
    for (const autoEvalObjectif of etapeAutoEvaluation.evaluations_objectifs) {
      const consolidationObjectif = consolidation.evaluations_objectifs.find(
        (evalObj) => evalObj.objectif_id === autoEvalObjectif.objectif_id,
      );

      if (!consolidationObjectif) continue;

      if (consolidationObjectif.note == null) {
        await this.prisma.evaluation_objectif.update({
          where: { id: consolidationObjectif.id },
          data: { note: autoEvalObjectif.note },
        });
      } else if (consolidationObjectif.note !== autoEvalObjectif.note) {
        await this.prisma.evaluation_objectif.update({
          where: { id: consolidationObjectif.id },
          data: { date_traitement: null },
        });
      }
    }

    for (const autoEvalCritere of etapeAutoEvaluation.evaluations_criteres) {
      const consolidationCritere = consolidation.evaluations_criteres.find(
        (evalCrit) => evalCrit.critere_id === autoEvalCritere.critere_id,
      );

      if (!consolidationCritere) continue;

      if (consolidationCritere.note == null) {
        await this.prisma.evaluation_critere.update({
          where: { id: consolidationCritere.id },
          data: { note: autoEvalCritere.note },
        });
      } else if (consolidationCritere.note !== autoEvalCritere.note) {
        await this.prisma.evaluation_critere.update({
          where: { id: consolidationCritere.id },
          data: { date_traitement: null },
        });
      }
    }
  }

  private getExistingConsolidation(ficheEvaluationId: string) {
    return this.prisma.etape_evaluation.findFirst({
      where: {
        fiche_evaluation_id: ficheEvaluationId,
        type: $Enums.etape_evaluation_enum.CONSOLIDATION,
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private creerEtapeConsolidation({
    auteurId,
    ficheEvaluationId,
    etapeAutoEvaluation,
  }: {
    auteurId: string;
    ficheEvaluationId: string;
    etapeAutoEvaluation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
  }) {
    return this.prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        fiche_evaluation_id: ficheEvaluationId,
        type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        evaluations_objectifs: {
          create: etapeAutoEvaluation.evaluations_objectifs.map(
            (evaluation) => ({
              id: randomUUID(),
              objectif_id: evaluation.objectif_id,
              auteur_id: auteurId,
              note: evaluation.note,
              commentaire: "",
            }),
          ),
        },
        evaluations_criteres: {
          create: etapeAutoEvaluation.evaluations_criteres.map(
            (evaluation) => ({
              id: randomUUID(),
              critere_id: evaluation.critere_id,
              auteur_id: auteurId,
              note: evaluation.note,
              commentaire: "",
            }),
          ),
        },
      },
    });
  }

  private setEtapeCouranteConsolidation(ficheEvaluationId: string) {
    return this.prisma.fiche_evaluation.update({
      where: { id: ficheEvaluationId },
      data: { etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION },
    });
  }

  private getEtapeAutoEvaluation(ficheEvaluationId: string) {
    return this.prisma.etape_evaluation.findFirstOrThrow({
      where: {
        type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        fiche_evaluation: {
          id: ficheEvaluationId,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }
}
