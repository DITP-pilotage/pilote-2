import {
  checkCsrf,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";
import { setDimensionSlotCommandSchema } from "@/server/analytics/handlers/SetDimensionSlotHandler";
import { zodValidateurCSRF } from "@/validation/publication";

export const analyticsRouter = createTRPCRouter({
  // Publique : la page de connexion envoie des événements avant l'authentification.
  dimensionSlots: publicProcedure.query(() =>
    getContainer("analytics").resolve("getDimensionSlotsQuery").run(),
  ),

  setDimensionSlot: protectedProcedure
    .input(setDimensionSlotCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("analytics")
        .resolve("setDimensionSlotHandler")
        .execute({ dimension: input.dimension, slot: input.slot });
    }),
});
