import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { axeCommandSchema } from "@/server/metadataAxe/handlers/EnregistrerAxeHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

export const metadataAxeRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataAxe").resolve("listerAxesAdminQuery").run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ axeId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataAxe")
        .resolve("recupererAxeQuery")
        .run({ axeId: input.axeId });
    }),

  verifierUtilisation: procédureProtégée
    .input(z.object({ axeId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataAxe")
        .resolve("verifierUtilisationAxeQuery")
        .run({ axeId: input.axeId });
    }),

  enregistrer: procédureProtégée
    .input(axeCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataAxe")
        .resolve("enregistrerAxeHandler")
        .execute(input);
    }),

  archiver: procédureProtégée
    .input(z.object({ axeId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataAxe")
        .resolve("archiverAxeHandler")
        .execute({ axeId: input.axeId });
    }),

  restorer: procédureProtégée
    .input(z.object({ axeId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataAxe")
        .resolve("restorerAxeHandler")
        .execute({ axeId: input.axeId });
    }),
});
