import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { perimetreCommandSchema } from "@/server/referentiels/perimetre/handlers/SavePerimetreHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const referentielPerimetreRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("listPerimetresAdminQuery")
      .run();
  }),

  get: protectedProcedure
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("getPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  getNextId: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("getNextPerimetreIdQuery")
      .run();
  }),

  checkUsage: protectedProcedure
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("checkPerimetreUsageQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  save: protectedProcedure
    .input(perimetreCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("savePerimetreHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archivePerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),

  restore: protectedProcedure
    .input(z.object({ perimetreId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restorePerimetreHandler")
        .execute({ perimetreId: input.perimetreId });
    }),
});
