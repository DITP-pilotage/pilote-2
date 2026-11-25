import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { checkAdminPermission } from "@/server/framework/trpc/checkAdminPermission";
import { z } from "zod";
import { setMotifProfilCommandSchema } from "@/server/formations/handlers/SetMotifProfilHandler";
import { savePeriodeInformationCommandSchema } from "@/server/formations/handlers/SavePeriodeInformationHandler";
import { recordSlideInActionCommandSchema } from "@/server/formations/handlers/RecordSlideInActionHandler";

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
    .input(setMotifProfilCommandSchema)
    .mutation(async ({ input, ctx }) => {
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
    .input(savePeriodeInformationCommandSchema)
    .mutation(async ({ input, ctx }) => {
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
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      checkAdminPermission(ctx.session);
      await getContainer("formations")
        .resolve("deletePeriodeInformationHandler")
        .execute({ id: input.id, maintenant: new Date() });
    }),

  // Ouvertes à tout utilisateur connecté : l'utilisateur et son profil viennent de la session.
  formationsAProposer: protectedProcedure.query(async ({ ctx }) =>
    getContainer("formations")
      .resolve("getFormationsAProposerQuery")
      .run({
        utilisateurId: ctx.session.user.id,
        profilCode: ctx.session.profil ?? null,
        maintenant: new Date(),
      }),
  ),

  recordSlideInAction: protectedProcedure
    .input(recordSlideInActionCommandSchema)
    .mutation(async ({ input, ctx }) => {
      await getContainer("formations")
        .resolve("recordSlideInActionHandler")
        .execute({
          utilisateurId: ctx.session.user.id,
          periodeId: input.periodeId,
          action: input.action,
          maintenant: new Date(),
        });
    }),
});
