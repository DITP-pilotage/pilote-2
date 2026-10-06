import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { porteurCommandSchema } from "@/server/metadata-porteur/handlers/EnregistrerPorteurHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataPorteurRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataPorteur")
      .resolve("listerPorteursAdminQuery")
      .run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataPorteur")
        .resolve("recupererPorteurQuery")
        .run({ porteurId: input.porteurId });
    }),

  récupérerIdSuivant: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataPorteur")
      .resolve("recupererIdSuivantPorteurQuery")
      .run();
  }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataPorteur")
        .resolve("verifierUtilisationPorteurQuery")
        .run({ porteurId: input.porteurId });
    }),

  enregistrer: protectedProcedure
    .input(porteurCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("enregistrerPorteurHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ porteurId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("archiverPorteurHandler")
        .execute({ porteurId: input.porteurId });
    }),

  restaurer: protectedProcedure
    .input(z.object({ porteurId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("restaurerPorteurHandler")
        .execute({ porteurId: input.porteurId });
    }),
});
