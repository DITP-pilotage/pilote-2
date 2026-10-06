import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { perimetreCommandSchema } from "@/server/referentiels/perimetre/handlers/EnregistrerPerimetreHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataPerimetreRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("listerPerimetresAdminQuery")
      .run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("recupererPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  récupérerIdSuivant: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("recupererIdSuivantPerimetreQuery")
      .run();
  }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("verifierUtilisationPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  enregistrer: protectedProcedure
    .input(perimetreCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("enregistrerPerimetreHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiverPerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),

  restaurer: protectedProcedure
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restaurerPerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),
});
