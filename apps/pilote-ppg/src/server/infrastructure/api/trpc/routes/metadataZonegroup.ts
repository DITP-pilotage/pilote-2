import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { zonegroupCommandSchema } from "@/server/metadataZonegroup/handlers/EnregistrerZonegroupHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

export const metadataZonegroupRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("listerZonegroupsAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ zoneGroupId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataZonegroup")
        .resolve("recupererZonegroupQuery")
        .run({ zoneGroupId: input.zoneGroupId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("recupererIdSuivantZonegroupQuery")
      .run();
  }),

  listerZonesDisponibles: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("listerZonesDisponiblesQuery")
      .run();
  }),

  enregistrer: procédureProtégée
    .input(zonegroupCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("enregistrerZonegroupHandler")
        .execute(input);
    }),

  archiver: procédureProtégée
    .input(z.object({ zoneGroupId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("archiverZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId });
    }),

  restorer: procédureProtégée
    .input(z.object({ zoneGroupId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("restorerZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId });
    }),
});
