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
          chantierId: input.chantierId,
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
          chantierId: input.chantierId,
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
          commentaireId: input.commentaireId,
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
        .merge(validationCommentaireFormulaire)
        .merge(validationBrouillonCommentaireAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("commentaires")
        .resolve("modifierBrouillonCommentaireUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  recupererHistorique: procédureProtégée
    .input(validationCommentaireContexte)
    .query(({ input }) => {
      return getContainer("commentaires")
        .resolve("recupererHistoriqueCommentaireQuery")
        .run(input.chantierId, input.territoireCode, input.type);
    }),
});
