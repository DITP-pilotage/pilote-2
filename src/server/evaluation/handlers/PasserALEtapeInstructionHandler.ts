import { $Enums } from "@prisma/client";
import { z } from "zod";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";

export const passerALEtapeInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
});

export class PasserALEtapeInstructionHandler {
  constructor(
    private readonly dependencies: {
      soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;
    },
  ) {}

  async execute(
    {
      ficheEvaluationIds,
    }: z.infer<typeof passerALEtapeInstructionCommandSchema>,
    auteurId: string,
  ) {
    for (const ficheEvaluationId of ficheEvaluationIds) {
      await this.dependencies.soumettreEtapeEvaluationService.execute({
        ficheEvaluationId,
        auteurId,
        nomEtapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        nomEtapeSuivante: $Enums.etape_evaluation_enum.INSTRUCTION,
      });
    }
  }
}
