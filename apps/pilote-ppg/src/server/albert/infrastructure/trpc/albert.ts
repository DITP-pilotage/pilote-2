import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

const conversationsRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    const useCase = getContainer("albert").resolve(
      "listerConversationsUseCase",
    );
    return useCase.execute({ utilisateurId: ctx.session.user.id });
  }),

  recuperer: protectedProcedure
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

  supprimer: protectedProcedure
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

  listerToutes: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        taillePage: z.number().int().min(1).max(100).default(25),
        recherche: z.string().trim().min(1).optional(),
        avecPouce: z.boolean().optional(),
        avecPouceBas: z.boolean().optional(),
        avecCommentaire: z.boolean().optional(),
        categories: z
          .array(z.nativeEnum($Enums.llm_call_categorie_probleme))
          .optional(),
        profilCodes: z.array(z.string()).optional(),
        triChamp: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
        triDirection: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }
      const query = getContainer("albert").resolve(
        "listerConversationsAdminQuery",
      );
      return query.run({
        page: input.page,
        taillePage: input.taillePage,
        recherche: input.recherche,
        avecPouce: input.avecPouce,
        avecPouceBas: input.avecPouceBas,
        avecCommentaire: input.avecCommentaire,
        categories: input.categories,
        profilCodes: input.profilCodes,
        tri: { champ: input.triChamp, direction: input.triDirection },
      });
    }),

  recupererPourAdmin: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }
      const query = getContainer("albert").resolve(
        "recupererConversationAdminQuery",
      );
      return query.run({ id: input.id });
    }),
});

export const albertRouter = createTRPCRouter({
  evaluer: protectedProcedure
    .input(
      z
        .discriminatedUnion("evaluation", [
          z.object({
            chatId: z.string().min(1),
            evaluation: z.literal($Enums.llm_call_evaluation.POSITIVE),
            commentaire: z.string().trim().min(1).optional(),
          }),
          z.object({
            chatId: z.string().min(1),
            evaluation: z.literal($Enums.llm_call_evaluation.NEGATIVE),
            categories: z
              .array(z.nativeEnum($Enums.llm_call_categorie_probleme))
              .min(1),
            commentaire: z.string().trim().min(1).optional(),
          }),
        ])
        .refine(
          (data) =>
            data.evaluation !== $Enums.llm_call_evaluation.NEGATIVE ||
            !data.categories.includes(
              $Enums.llm_call_categorie_probleme.AUTRE,
            ) ||
            !!data.commentaire,
          {
            message:
              "Un commentaire est obligatoire lorsque la catégorie « Autre » est sélectionnée",
            path: ["commentaire"],
          },
        ),
    )
    .mutation(async ({ input }) => {
      const container = getContainer("albert");
      const evaluerChatUseCase = container.resolve("evaluerChatUseCase");
      await evaluerChatUseCase.execute({
        chatId: input.chatId,
        evaluation: input.evaluation,
        commentaire: input.commentaire,
        categories:
          input.evaluation === $Enums.llm_call_evaluation.NEGATIVE
            ? input.categories
            : undefined,
      });
    }),
  conversations: conversationsRouter,
});
