import { z } from "zod";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import type { Inject } from "@/server/evaluation/module";

export const validerSaisieCriteresCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export type ValiderSaisieCriteresCommandSchema = z.infer<
  typeof validerSaisieCriteresCommandSchema
>;

export class ValiderSaisieCriteresHandler {
  private readonly transaction: Transaction;
  private readonly prisma: PrismaPilote;
  private readonly soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;

  constructor({
    transaction,
    prisma,
    soumettreEtapeEvaluationService,
  }: Inject<"transaction" | "prisma" | "soumettreEtapeEvaluationService">) {
    this.transaction = transaction;
    this.prisma = prisma;
    this.soumettreEtapeEvaluationService = soumettreEtapeEvaluationService;
  }

  async execute(command: ValiderSaisieCriteresCommandSchema, auteurId: string) {
    const updatedEtape = await this.transaction.run(async () => {
      const prisma = this.prisma.getInstance();

      const etape = await prisma.etape_evaluation.findFirstOrThrow({
        where: {
          fiche_evaluation: {
            id: command.ficheEvaluationId,
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      });

      return prisma.etape_evaluation.update({
        where: { id: etape.id },
        data: { criteres_valides: true },
      });
    });

    if (updatedEtape.objectifs_valides) {
      await this.soumettreEtapeEvaluationService.execute({
        ficheEvaluationId: command.ficheEvaluationId,
        auteurId: auteurId,
        nomEtapeCourante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        nomEtapeSuivante: $Enums.etape_evaluation_enum.CONSOLIDATION,
      });
    }
  }
}
