import {
  checkCsrf,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";
import { zodValidateurCSRF } from "@/validation/publication";
import { z } from "zod";
import { setMotifProfilCommandSchema } from "@/server/formations/handlers/SetMotifProfilHandler";
import { savePeriodeInformationCommandSchema } from "@/server/formations/handlers/SavePeriodeInformationHandler";

export const formationRouter = createTRPCRouter({
  listSeancesAVenir: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("formations")
      .resolve("listSeancesAVenirQuery")
      .run({ maintenant: new Date() });
  }),

  matriceProfils: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("formations").resolve("getMatriceProfilsQuery").run();
  }),

  setMotifProfil: protectedProcedure
    .input(setMotifProfilCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("formations")
        .resolve("setMotifProfilHandler")
        .execute({
          motifId: input.motifId,
          profilCode: input.profilCode,
          propose: input.propose,
        });
    }),

  periodesInformation: protectedProcedure.query(async ({ ctx }) => {
    checkAdminPermission(ctx.session);
    return getContainer("formations")
      .resolve("listPeriodesInformationQuery")
      .run({ maintenant: new Date() });
  }),

  savePeriodeInformation: protectedProcedure
    .input(savePeriodeInformationCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      return getContainer("formations")
        .resolve("savePeriodeInformationHandler")
        .execute({
          commande: {
            id: input.id,
            dateDebut: input.dateDebut,
            dateFin: input.dateFin,
            motifIds: input.motifIds,
          },
          maintenant: new Date(),
        });
    }),

  deletePeriodeInformation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      checkAdminPermission(ctx.session);
      await getContainer("formations")
        .resolve("deletePeriodeInformationHandler")
        .execute({ id: input.id, maintenant: new Date() });
    }),
});
