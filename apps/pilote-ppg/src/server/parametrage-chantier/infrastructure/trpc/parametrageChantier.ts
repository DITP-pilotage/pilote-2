import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { chantierCommandSchema } from "@/server/parametrage-chantier/handlers/SaveChantierHandler";
import { enregistrerPonderationsIndicateursCommandSchema } from "@/server/parametrage-chantier/handlers/SavePonderationsIndicateursHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const parametrageChantierRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("parametrageChantier")
      .resolve("listChantiersQuery")
      .run();
  }),

  get: protectedProcedure
    .input(z.object({ chantierId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("parametrageChantier")
        .resolve("getChantierQuery")
        .run({ chantierId: input.chantierId });
    }),

  getNextId: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("parametrageChantier").resolve("getNextIdQuery").run();
  }),

  listPpgs: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("parametrageChantier").resolve("listPpgsQuery").run();
  }),

  listPorteursMinistere: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("parametrageChantier")
      .resolve("listPorteursQuery")
      .run({ type: "MIN" });
  }),

  listPorteursDAC: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("parametrageChantier")
      .resolve("listPorteursQuery")
      .run({ type: "DAC" });
  }),

  listPerimetres: protectedProcedure
    .input(z.object({ porteurId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("parametrageChantier")
        .resolve("listPerimetresQuery")
        .run({ porteurId: input?.porteurId });
    }),

  listZonegroups: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("parametrageChantier")
      .resolve("listZonegroupsQuery")
      .run();
  }),

  save: protectedProcedure
    .input(chantierCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("parametrageChantier")
        .resolve("saveChantierHandler")
        .execute(input);
    }),

  getIndicateursPonderations: protectedProcedure
    .input(z.object({ chantierId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("parametrageChantier")
        .resolve("getIndicateursPonderationsChantierQuery")
        .run({ chantierId: input.chantierId });
    }),

  savePonderationsIndicateurs: protectedProcedure
    .input(
      enregistrerPonderationsIndicateursCommandSchema.and(zodValidateurCSRF),
    )
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("parametrageChantier")
        .resolve("savePonderationsIndicateursHandler")
        .execute(input, ctx.session.user.id);
    }),
});
