import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

const assertDitpAdmin = (profil: string | undefined) => {
  if (profil !== ProfilEnum.DITP_ADMIN) {
    throw new UnauthorizedError(
      "Vous n'êtes pas autorisé à effectuer cette action",
    );
  }
};

const utilisateurInput = z.object({ utilisateurId: z.string().uuid() });

export const albertAccessRouter = createTRPCRouter({
  listProfils: protectedProcedure.query(({ ctx }) => {
    assertDitpAdmin(ctx.session.profil);
    return getContainer("albertAccess").resolve("listProfilsUseCase").execute();
  }),

  setProfilActive: protectedProcedure
    .input(z.object({ profilCode: z.string(), active: z.boolean() }))
    .mutation(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("setProfilActiveUseCase")
        .execute(input);
    }),

  listUtilisateurs: protectedProcedure.query(({ ctx }) => {
    assertDitpAdmin(ctx.session.profil);
    return getContainer("albertAccess")
      .resolve("listUtilisateursUseCase")
      .execute();
  }),

  searchUtilisateurs: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("searchUtilisateursUseCase")
        .execute(input);
    }),

  addUtilisateur: protectedProcedure
    .input(utilisateurInput)
    .mutation(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("addUtilisateurUseCase")
        .execute(input);
    }),

  removeUtilisateur: protectedProcedure
    .input(utilisateurInput)
    .mutation(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("removeUtilisateurUseCase")
        .execute(input);
    }),
});
