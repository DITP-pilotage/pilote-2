import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

const conversationsRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    const useCase = getContainer("albert").resolve(
      "listerConversationsUseCase",
    );
    return useCase.execute({ utilisateurId: ctx.session.user.id });
  }),

  recuperer: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const useCase = getContainer("albert").resolve(
        "recupererConversationUseCase",
      );
      return useCase.execute({
        id: input.id,
        utilisateurId: ctx.session.user.id,
      });
    }),

  supprimer: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const useCase = getContainer("albert").resolve(
        "supprimerConversationUseCase",
      );
      await useCase.execute({
        id: input.id,
        utilisateurId: ctx.session.user.id,
      });
    }),
});

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
  conversations: conversationsRouter,
});
