import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { ppgCommandSchema } from "@/server/metadataPpg/handlers/EnregistrerPpgHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

export const metadataPpgRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPpg").resolve("listerPpgsAdminQuery").run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ ppgId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPpg")
        .resolve("recupererPpgQuery")
        .run({ ppgId: input.ppgId });
    }),

  verifierUtilisation: procédureProtégée
    .input(z.object({ ppgId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPpg")
        .resolve("verifierUtilisationPpgQuery")
        .run({ ppgId: input.ppgId });
    }),

  enregistrer: procédureProtégée
    .input(ppgCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPpg")
        .resolve("enregistrerPpgHandler")
        .execute(input);
    }),

  archiver: procédureProtégée
    .input(z.object({ ppgId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPpg")
        .resolve("archiverPpgHandler")
        .execute({ ppgId: input.ppgId });
    }),

  restorer: procédureProtégée
    .input(z.object({ ppgId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPpg")
        .resolve("restorerPpgHandler")
        .execute({ ppgId: input.ppgId });
    }),
});
