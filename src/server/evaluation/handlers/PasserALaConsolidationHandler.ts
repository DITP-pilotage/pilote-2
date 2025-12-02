import { z } from "zod";
import { Transaction } from "@/server/db/Transaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";

export const passerALaConsolidationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALaConsolidationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;
    },
  ) {}

  async execute(
    { ficheEvaluationIds }: z.infer<typeof passerALaConsolidationCommandSchema>,
    auteurId: string,
  ) {
    await this.dependencies.transaction.run(async () => {
      for (const ficheEvaluationId of ficheEvaluationIds) {
        await this.dependencies.soumettreEtapeEvaluationService.execute({
          ficheEvaluationId: ficheEvaluationId,
          auteurId: auteurId,
        });
      }
    });
  }
}
