import {
  $Enums,
  etape_evaluation,
  evaluation_objectif,
  evaluation_critere,
} from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const passerALEtapeInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALEtapeInstructionHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    {
      ficheEvaluationIds,
    }: z.infer<typeof passerALEtapeInstructionCommandSchema>,
    auteurId: string,
  ) {
    await this.dependencies.transaction.run(async () => {
      for (const ficheEvaluationId of ficheEvaluationIds) {
        const etapeConsolidation =
          await this.getEtapeConsolidation(ficheEvaluationId);

        const existingInstruction =
          await this.getExistingInstruction(ficheEvaluationId);

        if (!existingInstruction) {
          await this.creerEtapeInstruction({
            auteurId,
            ficheEvaluationId,
            etapeEvaluation: etapeConsolidation,
          });
        } else {
          await this.mettreAJourInstructionExistante({
            etapeConsolidation,
            instruction: existingInstruction,
          });
        }

        await this.setEtapeCouranteInstruction(ficheEvaluationId);
      }
    });
  }

  private creerEtapeInstruction({
    auteurId,
    ficheEvaluationId,
    etapeEvaluation,
  }: {
    auteurId: string;
    ficheEvaluationId: string;
    etapeEvaluation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
  }) {
    return this.prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        fiche_evaluation_id: ficheEvaluationId,
        type: $Enums.etape_evaluation_enum.INSTRUCTION,
        evaluations_objectifs: {
          create: etapeEvaluation.evaluations_objectifs.map((evaluation) => ({
            id: randomUUID(),
            objectif_id: evaluation.objectif_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          })),
        },
        evaluations_criteres: {
          create: etapeEvaluation.evaluations_criteres.map((evaluation) => ({
            id: randomUUID(),
            critere_id: evaluation.critere_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          })),
        },
      },
    });
  }

  private setEtapeCouranteInstruction(ficheEvaluationId: string) {
    return this.prisma.fiche_evaluation.update({
      where: { id: ficheEvaluationId },
      data: { etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION },
    });
  }

  private getEtapeConsolidation(ficheEvaluationId: string) {
    return this.prisma.etape_evaluation.findFirstOrThrow({
      where: {
        type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        fiche_evaluation: {
          id: ficheEvaluationId,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        },
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private getExistingInstruction(ficheEvaluationId: string) {
    return this.prisma.etape_evaluation.findFirst({
      where: {
        fiche_evaluation_id: ficheEvaluationId,
        type: $Enums.etape_evaluation_enum.INSTRUCTION,
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private async mettreAJourInstructionExistante({
    etapeConsolidation,
    instruction,
  }: {
    etapeConsolidation: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
    instruction: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
  }) {
    for (const consolidationObjectif of etapeConsolidation.evaluations_objectifs) {
      const instructionObjectif = instruction.evaluations_objectifs.find(
        (evalObj) => evalObj.objectif_id === consolidationObjectif.objectif_id,
      );

      if (!instructionObjectif) continue;

      if (instructionObjectif.note == null) {
        await this.prisma.evaluation_objectif.update({
          where: { id: instructionObjectif.id },
          data: { note: consolidationObjectif.note },
        });
      } else if (instructionObjectif.note !== consolidationObjectif.note) {
        await this.prisma.evaluation_objectif.update({
          where: { id: instructionObjectif.id },
          data: { date_traitement: null },
        });
      }
    }

    for (const consolidationCritere of etapeConsolidation.evaluations_criteres) {
      const instructionCritere = instruction.evaluations_criteres.find(
        (evalCrit) => evalCrit.critere_id === consolidationCritere.critere_id,
      );

      if (!instructionCritere) continue;

      if (instructionCritere.note == null) {
        await this.prisma.evaluation_critere.update({
          where: { id: instructionCritere.id },
          data: { note: consolidationCritere.note },
        });
      } else if (instructionCritere.note !== consolidationCritere.note) {
        await this.prisma.evaluation_critere.update({
          where: { id: instructionCritere.id },
          data: { date_traitement: null },
        });
      }
    }
  }

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }
}
