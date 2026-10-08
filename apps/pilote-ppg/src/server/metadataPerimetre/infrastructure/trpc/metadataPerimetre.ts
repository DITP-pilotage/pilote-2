import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { perimetreCommandSchema } from "@/server/metadataPerimetre/handlers/EnregistrerPerimetreHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataPerimetreRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataPerimetre")
      .resolve("listerPerimetresAdminQuery")
      .run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataPerimetre")
        .resolve("recupererPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  récupérerIdSuivant: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataPerimetre")
      .resolve("recupererIdSuivantPerimetreQuery")
      .run();
  }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataPerimetre")
        .resolve("verifierUtilisationPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  enregistrer: protectedProcedure
    .input(perimetreCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("enregistrerPerimetreHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("archiverPerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),

  restorer: protectedProcedure
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("restorerPerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),
});
