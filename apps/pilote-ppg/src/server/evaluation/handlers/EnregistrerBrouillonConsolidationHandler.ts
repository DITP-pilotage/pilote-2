import { $Enums } from "@prisma/client";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  EnregistrerEvaluationCommandSchema,
  EnregistrerEvaluationService,
} from "@/server/evaluation/services/EnregistrerEvaluationService";
import type { Inject } from "@/server/evaluation/module";

export class EnregistrerBrouillonConsolidationHandler {
  private readonly transaction: Transaction;
  private readonly prisma: PrismaPilote;

  constructor({ transaction, prisma }: Inject<"transaction" | "prisma">) {
    this.transaction = transaction;
    this.prisma = prisma;
  }

  async execute(
    commands: EnregistrerEvaluationCommandSchema[],
    auteurId: string,
  ) {
    for (const command of commands) {
      await new EnregistrerEvaluationService({
        transaction: this.transaction,
        prisma: this.prisma,
      }).enregister({
        command,
        auteurId,
        etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
      });
    }
  }
}
