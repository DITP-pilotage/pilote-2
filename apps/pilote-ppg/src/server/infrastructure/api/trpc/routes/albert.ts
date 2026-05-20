import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";

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

const adminRouter = créerRouteurTRPC({
  listerConversations: procédureProtégée
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        taillePage: z.number().int().min(1).max(100).default(25),
        recherche: z.string().trim().min(1).optional(),
        avecPouce: z.boolean().optional(),
        avecPouceBas: z.boolean().optional(),
        avecCommentaire: z.boolean().optional(),
        profilCodes: z.array(z.string()).optional(),
        triChamp: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
        triDirection: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }
      const useCase = getContainer("albert").resolve(
        "listerConversationsAdminUseCase",
      );
      return useCase.execute({
        page: input.page,
        taillePage: input.taillePage,
        recherche: input.recherche,
        avecPouce: input.avecPouce,
        avecPouceBas: input.avecPouceBas,
        avecCommentaire: input.avecCommentaire,
        profilCodes: input.profilCodes,
        tri: { champ: input.triChamp, direction: input.triDirection },
      });
    }),

  recupererConversation: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }
      const useCase = getContainer("albert").resolve(
        "recupererConversationAdminUseCase",
      );
      return useCase.execute({ id: input.id });
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
  admin: adminRouter,
});
