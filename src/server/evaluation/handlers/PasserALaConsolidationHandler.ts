import { z } from "zod";
import { Transaction } from "@/server/db/Transaction";
import { SoumettreAutoEvaluationService } from "@/server/evaluation/services/SoumettreAutoEvaluationService";

export const passerALaConsolidationCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALaConsolidationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      soumettreAutoEvaluationService: SoumettreAutoEvaluationService;
    },
  ) {}

  async execute(
    { ficheEvaluationIds }: z.infer<typeof passerALaConsolidationCommandSchema>,
    auteurId: string,
  ) {
    await this.dependencies.transaction.run(async () => {
      for (const ficheEvaluationId of ficheEvaluationIds) {
        await this.dependencies.soumettreAutoEvaluationService.execute(
          ficheEvaluationId,
          auteurId,
        );
      }
    });
  }
}
