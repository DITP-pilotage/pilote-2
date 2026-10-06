import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { zonegroupCommandSchema } from "@/server/metadata-zonegroup/handlers/EnregistrerZonegroupHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataZonegroupRouter = createTRPCRouter({
  lister: protectedProcedure
    .input(z.object({ actifsSeulement: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataZonegroup")
        .resolve("listerZonegroupsAdminQuery")
        .run({ actifsSeulement: input?.actifsSeulement });
    }),

  récupérer: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataZonegroup")
        .resolve("recupererZonegroupQuery")
        .run({ zoneGroupId: input.zoneGroupId });
    }),

  récupérerIdSuivant: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("recupererIdSuivantZonegroupQuery")
      .run();
  }),

  listerZonesDisponibles: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("listerZonesDisponiblesQuery")
      .run();
  }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataZonegroup")
        .resolve("verifierUtilisationZonegroupQuery")
        .run({ zoneGroupId: input.zoneGroupId });
    }),

  enregistrer: protectedProcedure
    .input(zonegroupCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("enregistrerZonegroupHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("archiverZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId });
    }),

  restaurer: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("restaurerZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId });
    }),
});
