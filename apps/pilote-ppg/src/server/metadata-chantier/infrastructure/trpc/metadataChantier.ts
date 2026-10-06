import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { chantierCommandSchema } from "@/server/metadata-chantier/handlers/EnregistrerChantierHandler";
import { enregistrerPonderationsIndicateursCommandSchema } from "@/server/metadata-chantier/handlers/EnregistrerPonderationsIndicateursHandler";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";

export const metadataChantierRouter = createTRPCRouter({
  lister: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerChantiersQuery")
      .run();
  }),

  récupérer: protectedProcedure
    .input(z.object({ chantierId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataChantier")
        .resolve("recupererChantierQuery")
        .run({ chantierId: input.chantierId });
    }),

  récupérerIdSuivant: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataChantier")
      .resolve("recupererIdSuivantQuery")
      .run();
  }),

  listerPpgs: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataChantier").resolve("listerPpgsQuery").run();
  }),

  listerPorteursMinistere: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPorteursQuery")
      .run({ type: "MIN" });
  }),

  listerPorteursDAC: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPorteursQuery")
      .run({ type: "DAC" });
  }),

  listerPerimetres: protectedProcedure
    .input(z.object({ porteurId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataChantier")
        .resolve("listerPerimetresQuery")
        .run({ porteurId: input?.porteurId });
    }),

  listerZonegroups: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerZonegroupsQuery")
      .run();
  }),

  enregistrer: protectedProcedure
    .input(chantierCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataChantier")
        .resolve("enregistrerChantierHandler")
        .execute(input);
    }),

  récupérerIndicateursPonderations: protectedProcedure
    .input(z.object({ chantierId: z.string() }))
    .query(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      return getContainer("metadataChantier")
        .resolve("recupererIndicateursPonderationsChantierQuery")
        .run({ chantierId: input.chantierId });
    }),

  enregistrerPonderationsIndicateurs: protectedProcedure
    .input(
      enregistrerPonderationsIndicateursCommandSchema.and(zodValidateurCSRF),
    )
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("metadataChantier")
        .resolve("enregistrerPonderationsIndicateursHandler")
        .execute(input, ctx.session.user.id);
    }),
});
