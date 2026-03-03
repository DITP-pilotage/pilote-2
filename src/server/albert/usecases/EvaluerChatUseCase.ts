import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

type Dependencies = {
  prisma: PrismaPilote;
};

export class EvaluerChatUseCase {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma;
  }

  async execute({ chatId, evaluation }: { chatId: string; evaluation: $Enums.llm_call_evaluation }) {
    await this.prisma.getInstance().llm_calls.update({
      where: { id: chatId },
      data: { evaluation },
    });
  }
}
