import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { axeCommandSchema } from "@/server/referentiels/axe/handlers/EnregistrerAxeHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataAxeRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("referentiels").resolve("listerAxesAdminQuery").run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ axeId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("recupererAxeQuery")
        .run({ axeId: input.axeId });
    }),

  verifierUtilisation: protectedProcedure
    .input(z.object({ axeId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("referentiels")
        .resolve("verifierUtilisationAxeQuery")
        .run({ axeId: input.axeId });
    }),

  enregistrer: protectedProcedure
    .input(axeCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("enregistrerAxeHandler")
        .execute(input);
    }),

  archiver: protectedProcedure
    .input(z.object({ axeId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("archiverAxeHandler")
        .execute({ axeId: input.axeId });
    }),

  restaurer: protectedProcedure
    .input(z.object({ axeId: z.string() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("referentiels")
        .resolve("restaurerAxeHandler")
        .execute({ axeId: input.axeId });
    }),
});
