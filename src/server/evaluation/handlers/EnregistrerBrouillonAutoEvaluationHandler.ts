import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Transaction } from "@/server/db/Transaction";
import {
  EnregistrerEvaluationCommandSchema,
  EnregistrerEvaluationService,
} from "@/server/evaluation/services/EnregistrerEvaluationService";

export class EnregistrerBrouillonAutoEvaluationHandler {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute(command: EnregistrerEvaluationCommandSchema, auteurId: string) {
    await new EnregistrerEvaluationService(this.dependencies).enregister({
      command,
      auteurId,
      etapeCourante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    });
  }
}
