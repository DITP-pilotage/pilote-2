import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { porteurCommandSchema } from "@/server/referentiels/porteur/handlers/SavePorteurHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const referentielPorteurRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels").resolve("listPorteursAdminQuery").run();
  }),

  get: protectedProcedure
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("getPorteurQuery")
        .run({ porteurId: input.porteurId });
    }),

  getNextId: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels").resolve("getNextPorteurIdQuery").run();
  }),

  checkUsage: protectedProcedure
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("checkPorteurUsageQuery")
        .run({ porteurId: input.porteurId });
    }),

  save: protectedProcedure
    .input(porteurCommandSchema)
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("savePorteurHandler")
        .execute(input);
    }),

  archive: protectedProcedure
    .input(z.object({ porteurId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archivePorteurHandler")
        .execute({ porteurId: input.porteurId });
    }),

  restore: protectedProcedure
    .input(z.object({ porteurId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restorePorteurHandler")
        .execute({ porteurId: input.porteurId });
    }),
});
