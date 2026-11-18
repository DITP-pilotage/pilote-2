import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const formationRouter = createTRPCRouter({
  listSeancesAVenir: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("formations")
      .resolve("listSeancesAVenirQuery")
      .run({ maintenant: new Date() });
  }),
});
