import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { porteurCommandSchema } from "@/server/metadataPorteur/handlers/EnregistrerPorteurHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

export const metadataPorteurRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPorteur")
      .resolve("listerPorteursAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPorteur")
        .resolve("recupererPorteurQuery")
        .run({ porteurId: input.porteurId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPorteur")
      .resolve("recupererIdSuivantPorteurQuery")
      .run();
  }),

  verifierUtilisation: procédureProtégée
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPorteur")
        .resolve("verifierUtilisationPorteurQuery")
        .run({ porteurId: input.porteurId });
    }),

  enregistrer: procédureProtégée
    .input(porteurCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("enregistrerPorteurHandler")
        .execute(input);
    }),

  archiver: procédureProtégée
    .input(z.object({ porteurId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("archiverPorteurHandler")
        .execute({ porteurId: input.porteurId });
    }),

  restorer: procédureProtégée
    .input(z.object({ porteurId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("restorerPorteurHandler")
        .execute({ porteurId: input.porteurId });
    }),
});
