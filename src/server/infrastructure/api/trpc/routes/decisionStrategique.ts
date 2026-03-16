import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import {
  validationDecisionStrategiqueContexte,
  validationDecisionStrategiqueFormulaire,
  validationBrouillonDecisionStrategiqueAPublier,
  validationDecisionStrategiqueAModifier,
} from "validation/decisionStrategique";

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const decisionStrategiqueRouter = créerRouteurTRPC({
  publier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationDecisionStrategiqueFormulaire)
        .merge(validationDecisionStrategiqueContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importDecisionStrategique")
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

  enregistrerEnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationDecisionStrategiqueFormulaire)
        .merge(validationDecisionStrategiqueContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importDecisionStrategique")
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

  publierUnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationDecisionStrategiqueFormulaire)
        .merge(validationBrouillonDecisionStrategiqueAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importDecisionStrategique")
        .resolve("publierBrouillonDecisionStrategiqueUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifierLeBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationDecisionStrategiqueFormulaire)
        .merge(validationBrouillonDecisionStrategiqueAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importDecisionStrategique")
        .resolve("modifierBrouillonDecisionStrategiqueUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationDecisionStrategiqueFormulaire)
        .merge(validationDecisionStrategiqueAModifier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importDecisionStrategique")
        .resolve("modifierDecisionStrategiquePublieeUseCase")
        .execute({
          decisionStrategiqueId: input.decisionStrategiqueId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  recupererHistorique: procédureProtégée
    .input(validationDecisionStrategiqueContexte)
    .query(({ input }) => {
      return getContainer("importDecisionStrategique")
        .resolve("recupererHistoriqueDecisionStrategiqueQuery")
        .run(input.chantierId);
    }),
});
