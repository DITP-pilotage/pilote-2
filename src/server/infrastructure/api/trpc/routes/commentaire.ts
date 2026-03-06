import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  validationCommentaireContexte,
  validationCommentaireFormulaire,
  validationCommentaireAModifier,
  validationBrouillonCommentaireAPublier,
} from "validation/commentaire";
import { getContainer } from "@/server/dependances";

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const commentaireRouter = créerRouteurTRPC({
  publier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationCommentaireContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("commentaires")
        .resolve("publierCommentaireUseCase")
        .execute({
          chantierId: input.réformeId,
          territoireCode: input.territoireCode,
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
        .merge(validationCommentaireFormulaire)
        .merge(validationCommentaireContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("commentaires")
        .resolve("enregistrerBrouillonCommentaireUseCase")
        .execute({
          chantierId: input.réformeId,
          territoireCode: input.territoireCode,
          type: input.type,
          contenu: input.contenu,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationCommentaireAModifier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("commentaires")
        .resolve("modifierCommentairePublieUseCase")
        .execute({
          commentaireAModifier: input.commentaireAModifier,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  publierUnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationBrouillonCommentaireAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("commentaires")
        .resolve("publierBrouillonCommentaireUseCase")
        .execute({
          brouillon: input.brouillon,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifierLeBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationBrouillonCommentaireAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("commentaires")
        .resolve("modifierBrouillonCommentaireUseCase")
        .execute({
          brouillon: input.brouillon,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  récupérerHistorique: procédureProtégée
    .input(validationCommentaireContexte)
    .query(({ input }) => {
      return getContainer("commentaires")
        .resolve("recupererHistoriqueCommentaireQuery")
        .run(input.réformeId, input.territoireCode, input.type);
    }),

  recupererDernierBrouillon: procédureProtégée
    .input(validationCommentaireContexte)
    .query(({ input, ctx }) => {
      return getContainer("commentaires")
        .resolve("recupererDernierBrouillonCommentaireQuery")
        .run(input.réformeId, input.territoireCode, input.type, ctx.session.user.id);
    }),
});
