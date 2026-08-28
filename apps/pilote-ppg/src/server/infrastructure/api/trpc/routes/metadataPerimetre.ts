import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { perimetreCommandSchema } from "@/server/metadataPerimetre/handlers/EnregistrerPerimetreHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

export const metadataPerimetreRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPerimetre")
      .resolve("listerPerimetresAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPerimetre")
        .resolve("recupererPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPerimetre")
      .resolve("recupererIdSuivantPerimetreQuery")
      .run();
  }),

  verifierUtilisation: procédureProtégée
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPerimetre")
        .resolve("verifierUtilisationPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  enregistrer: procédureProtégée
    .input(perimetreCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("enregistrerPerimetreHandler")
        .execute(input);
    }),

  archiver: procédureProtégée
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("archiverPerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),

  restorer: procédureProtégée
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("restorerPerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),
});
