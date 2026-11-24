import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import {
  validationDecisionStrategiqueContexte,
  validationDecisionStrategiqueFormulaire,
  validationBrouillonDecisionStrategiqueAPublier,
  validationDecisionStrategiqueAModifier,
} from "@/validation/decisionStrategique";

export const decisionStrategiqueRouter = createTRPCRouter({
  publier: protectedProcedure
    .input(
      validationDecisionStrategiqueFormulaire.merge(
        validationDecisionStrategiqueContexte,
      ),
    )
    .mutation(({ input, ctx }) => {
      return getContainer("decisionStrategique")
        .resolve("publierDecisionStrategiqueUseCase")
        .execute({
          chantierId: input.chantierId,
          type: input.type,
          contenu: input.contenu,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  enregistrerEnBrouillon: protectedProcedure
    .input(
      validationDecisionStrategiqueFormulaire.merge(
        validationDecisionStrategiqueContexte,
      ),
    )
    .mutation(({ input, ctx }) => {
      return getContainer("decisionStrategique")
        .resolve("enregistrerBrouillonDecisionStrategiqueUseCase")
        .execute({
          chantierId: input.chantierId,
          type: input.type,
          contenu: input.contenu,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  publierUnBrouillon: protectedProcedure
    .input(
      validationDecisionStrategiqueFormulaire.merge(
        validationBrouillonDecisionStrategiqueAPublier,
      ),
    )
    .mutation(({ input, ctx }) => {
      return getContainer("decisionStrategique")
        .resolve("publierBrouillonDecisionStrategiqueUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifierLeBrouillon: protectedProcedure
    .input(
      validationDecisionStrategiqueFormulaire.merge(
        validationBrouillonDecisionStrategiqueAPublier,
      ),
    )
    .mutation(({ input, ctx }) => {
      return getContainer("decisionStrategique")
        .resolve("modifierBrouillonDecisionStrategiqueUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifier: protectedProcedure
    .input(
      validationDecisionStrategiqueFormulaire.merge(
        validationDecisionStrategiqueAModifier,
      ),
    )
    .mutation(({ input, ctx }) => {
      return getContainer("decisionStrategique")
        .resolve("modifierDecisionStrategiquePublieeUseCase")
        .execute({
          decisionStrategiqueId: input.decisionStrategiqueId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  recupererHistorique: protectedProcedure
    .input(validationDecisionStrategiqueContexte)
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(input.chantierId, null);
      return getContainer("decisionStrategique")
        .resolve("recupererHistoriqueDecisionStrategiqueQuery")
        .run(input.chantierId);
    }),
});
