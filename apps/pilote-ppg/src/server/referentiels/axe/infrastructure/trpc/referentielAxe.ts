import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { axeCommandSchema } from "@/server/referentiels/axe/handlers/SaveAxeHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const referentielAxeRouter = createTRPCRouter({
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
    .input(axeCommandSchema)
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("saveAxeHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ axeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiveAxeHandler")
        .execute({ axeId: input.axeId });
    }),

  restore: protectedProcedure
    .input(z.object({ axeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restoreAxeHandler")
        .execute({ axeId: input.axeId });
    }),
});
