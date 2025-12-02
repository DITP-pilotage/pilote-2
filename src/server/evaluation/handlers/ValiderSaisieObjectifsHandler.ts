import { z } from "zod";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";

export const validerSaisieObjectifsCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export type ValiderSaisieObjectifsCommandSchema = z.infer<
  typeof validerSaisieObjectifsCommandSchema
>;

export class ValiderSaisieObjectifsHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
      soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;
    },
  ) {}

  async execute(
    command: ValiderSaisieObjectifsCommandSchema,
    auteurId: string,
  ) {
    const updatedEtape = await this.dependencies.transaction.run(async () => {
      const prisma = this.dependencies.prisma.getInstance();

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
        data: { objectifs_valides: true },
      });
    });

    if (updatedEtape.criteres_valides) {
      await this.dependencies.soumettreEtapeEvaluationService.execute({
        ficheEvaluationId: command.ficheEvaluationId,
        auteurId: auteurId,
      });
    }
  }
}
