import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const albertRouter = créerRouteurTRPC({
  evaluer: procédureProtégée
    .input(
      z.discriminatedUnion("evaluation", [
        z.object({
          chatId: z.string().min(1),
          evaluation: z.literal($Enums.llm_call_evaluation.POSITIVE),
        }),
        z.object({
          chatId: z.string().min(1),
          evaluation: z.literal($Enums.llm_call_evaluation.NEGATIVE),
          commentaire: z.string().min(1),
        }),
      ]),
    )
    .mutation(async ({ input }) => {
      const container = getContainer("albert");
      const evaluerChatUseCase = container.resolve("evaluerChatUseCase");
      await evaluerChatUseCase.execute({
        chatId: input.chatId,
        evaluation: input.evaluation,
        commentaire:
          input.evaluation === $Enums.llm_call_evaluation.NEGATIVE
            ? input.commentaire
            : undefined,
      });
    }),
});
