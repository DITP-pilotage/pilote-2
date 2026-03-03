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

  async execute({
    chatId,
    evaluation,
    commentaire,
  }: {
    chatId: string;
    evaluation: $Enums.llm_call_evaluation;
    commentaire?: string;
  }) {
    await this.prisma.getInstance().llm_calls.update({
      where: { id: chatId },
      data: { evaluation, commentaire },
    });
  }
}
