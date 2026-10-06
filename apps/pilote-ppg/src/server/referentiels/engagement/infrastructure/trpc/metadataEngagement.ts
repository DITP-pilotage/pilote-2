import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { engagementCommandSchema } from "@/server/referentiels/engagement/handlers/EnregistrerEngagementHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataEngagementRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("listerEngagementsAdminQuery")
      .run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("recupererEngagementQuery")
        .run({ engagementId: input.engagementId });
    }),

  récupérerIdSuivant: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("recupererIdSuivantEngagementQuery")
      .run();
  }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ engagementShort: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("verifierUtilisationEngagementQuery")
        .run({ engagementShort: input.engagementShort });
    }),

  enregistrer: protectedProcedure
    .input(engagementCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("enregistrerEngagementHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ engagementId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiverEngagementHandler")
        .execute({ engagementId: input.engagementId });
    }),

  restaurer: protectedProcedure
    .input(z.object({ engagementId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restaurerEngagementHandler")
        .execute({ engagementId: input.engagementId });
    }),
});
