import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { engagementCommandSchema } from "@/server/referentiels/engagement/handlers/SaveEngagementHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const referentielEngagementRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("listEngagementsAdminQuery")
      .run();
  }),

  get: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("getEngagementQuery")
        .run({ engagementId: input.engagementId });
    }),

  getNextId: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels")
      .resolve("getNextEngagementIdQuery")
      .run();
  }),

  checkUsage: protectedProcedure
    .input(z.object({ engagementShort: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("checkEngagementUsageQuery")
        .run({ engagementShort: input.engagementShort });
    }),

  save: protectedProcedure
    .input(engagementCommandSchema)
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("saveEngagementHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiveEngagementHandler")
        .execute({ engagementId: input.engagementId });
    }),

  restore: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restoreEngagementHandler")
        .execute({ engagementId: input.engagementId });
    }),
});
