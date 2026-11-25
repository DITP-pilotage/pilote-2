import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ppgCommandSchema } from "@/server/referentiels/ppg/handlers/SavePpgHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const referentielPpgRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels").resolve("listPpgsAdminQuery").run();
  }),

  get: protectedProcedure
    .input(z.object({ ppgId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("getPpgQuery")
        .run({ ppgId: input.ppgId });
    }),

  checkUsage: protectedProcedure
    .input(z.object({ ppgId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("checkPpgUsageQuery")
        .run({ ppgId: input.ppgId });
    }),

  save: protectedProcedure
    .input(ppgCommandSchema)
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("savePpgHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ ppgId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archivePpgHandler")
        .execute({ ppgId: input.ppgId });
    }),

  restore: protectedProcedure
    .input(z.object({ ppgId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restorePpgHandler")
        .execute({ ppgId: input.ppgId });
    }),
});
