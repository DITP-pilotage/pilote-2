import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { axeCommandSchema } from "@/server/referentiels/axe/handlers/SaveAxeHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataAxeRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels").resolve("listAxesAdminQuery").run();
  }),

  get: protectedProcedure
    .input(z.object({ axeId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("getAxeQuery")
        .run({ axeId: input.axeId });
    }),

  checkUsage: protectedProcedure
    .input(z.object({ axeId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("checkAxeUsageQuery")
        .run({ axeId: input.axeId });
    }),

  save: protectedProcedure
    .input(axeCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("saveAxeHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ axeId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiveAxeHandler")
        .execute({ axeId: input.axeId });
    }),

  restore: protectedProcedure
    .input(z.object({ axeId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restoreAxeHandler")
        .execute({ axeId: input.axeId });
    }),
});
