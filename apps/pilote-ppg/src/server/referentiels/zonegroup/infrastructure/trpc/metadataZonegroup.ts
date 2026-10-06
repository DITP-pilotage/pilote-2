import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { zonegroupCommandSchema } from "@/server/referentiels/zonegroup/handlers/SaveZonegroupHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataZonegroupRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ actifsSeulement: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("listZonegroupsAdminQuery")
        .run({ actifsSeulement: input?.actifsSeulement });
    }),

  get: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("getZonegroupQuery")
        .run({ zoneGroupId: input.zoneGroupId });
    }),

  getNextId: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("getNextZonegroupIdQuery")
      .run();
  }),

  listZonesDisponibles: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("listZonesDisponiblesQuery")
      .run();
  }),

  checkUsage: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("checkZonegroupUsageQuery")
        .run({ zoneGroupId: input.zoneGroupId });
    }),

  save: protectedProcedure
    .input(zonegroupCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("saveZonegroupHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiveZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId });
    }),

  restore: protectedProcedure
    .input(z.object({ zoneGroupId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restoreZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId });
    }),
});
