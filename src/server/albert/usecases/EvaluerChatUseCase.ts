import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/albert/module";

export class EvaluerChatUseCase {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
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
    const dernierTour = await this.prisma.getInstance().llm_calls.findFirst({
      where: { chat_id: chatId },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });

    if (!dernierTour) return;

    await this.prisma.getInstance().llm_calls.update({
      where: { id: dernierTour.id },
      data: { evaluation, commentaire },
    });
  }
}
