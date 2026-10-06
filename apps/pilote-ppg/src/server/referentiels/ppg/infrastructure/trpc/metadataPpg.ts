import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { ppgCommandSchema } from "@/server/referentiels/ppg/handlers/EnregistrerPpgHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataPpgRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels").resolve("listerPpgsAdminQuery").run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ ppgId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("recupererPpgQuery")
        .run({ ppgId: input.ppgId });
    }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ ppgId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("verifierUtilisationPpgQuery")
        .run({ ppgId: input.ppgId });
    }),

  enregistrer: protectedProcedure
    .input(ppgCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("enregistrerPpgHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ ppgId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiverPpgHandler")
        .execute({ ppgId: input.ppgId });
    }),

  restaurer: protectedProcedure
    .input(z.object({ ppgId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restaurerPpgHandler")
        .execute({ ppgId: input.ppgId });
    }),
});
