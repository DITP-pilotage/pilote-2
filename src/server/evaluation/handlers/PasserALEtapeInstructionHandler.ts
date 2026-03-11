import { $Enums } from "@prisma/client";
import { z } from "zod";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import type { Inject } from "@/server/evaluation/module";

export const passerALEtapeInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALEtapeInstructionHandler {
  private readonly soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;

  constructor({
    soumettreEtapeEvaluationService,
  }: Inject<"soumettreEtapeEvaluationService">) {
    this.soumettreEtapeEvaluationService = soumettreEtapeEvaluationService;
  }

  async execute(
    {
      ficheEvaluationIds,
    }: z.infer<typeof passerALEtapeInstructionCommandSchema>,
    auteurId: string,
  ) {
    for (const ficheEvaluationId of ficheEvaluationIds) {
      await this.soumettreEtapeEvaluationService.execute({
        ficheEvaluationId,
        auteurId,
        nomEtapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        nomEtapeSuivante: $Enums.etape_evaluation_enum.INSTRUCTION,
      });
    }
  }
}
