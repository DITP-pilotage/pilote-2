import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import type { Inject } from "@/server/evaluation/module";

export const passerALaConsolidationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALaConsolidationHandler {
  private readonly transaction: Transaction;
  private readonly soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;

  constructor({
    transaction,
    soumettreEtapeEvaluationService,
  }: Inject<"transaction" | "soumettreEtapeEvaluationService">) {
    this.transaction = transaction;
    this.soumettreEtapeEvaluationService = soumettreEtapeEvaluationService;
  }

  async execute(
    { ficheEvaluationIds }: z.infer<typeof passerALaConsolidationCommandSchema>,
    auteurId: string,
  ) {
    await this.transaction.run(async () => {
      for (const ficheEvaluationId of ficheEvaluationIds) {
        await this.soumettreEtapeEvaluationService.execute({
          ficheEvaluationId: ficheEvaluationId,
          auteurId: auteurId,
          nomEtapeCourante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          nomEtapeSuivante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
      }
    });
  }
}
