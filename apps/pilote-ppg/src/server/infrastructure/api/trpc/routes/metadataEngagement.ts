import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { engagementCommandSchema } from "@/server/metadataEngagement/handlers/EnregistrerEngagementHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

export const metadataEngagementRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataEngagement")
      .resolve("listerEngagementsAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataEngagement")
        .resolve("recupererEngagementQuery")
        .run({ engagementId: input.engagementId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataEngagement")
      .resolve("recupererIdSuivantEngagementQuery")
      .run();
  }),

  verifierUtilisation: procédureProtégée
    .input(z.object({ engagementShort: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataEngagement")
        .resolve("verifierUtilisationEngagementQuery")
        .run({ engagementShort: input.engagementShort });
    }),

  enregistrer: procédureProtégée
    .input(engagementCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataEngagement")
        .resolve("enregistrerEngagementHandler")
        .execute(input);
    }),

  archiver: procédureProtégée
    .input(z.object({ engagementId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataEngagement")
        .resolve("archiverEngagementHandler")
        .execute({ engagementId: input.engagementId });
    }),

  restorer: procédureProtégée
    .input(z.object({ engagementId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataEngagement")
        .resolve("restorerEngagementHandler")
        .execute({ engagementId: input.engagementId });
    }),
});
