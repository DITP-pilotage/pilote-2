import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  EnregistrerEvaluationCommandSchema,
  EnregistrerEvaluationService,
} from "@/server/evaluation/services/EnregistrerEvaluationService";

export class EnregistrerBrouillonConsolidationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(
    commands: EnregistrerEvaluationCommandSchema[],
    auteurId: string,
  ) {
    for (const command of commands) {
      await new EnregistrerEvaluationService(this.dependencies).enregister({
        command,
        auteurId,
        etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
      });
    }
  }
}
