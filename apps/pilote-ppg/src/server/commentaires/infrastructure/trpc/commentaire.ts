import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import {
  validationCommentaireContexte,
  validationCommentaireFormulaire,
  validationCommentaireAModifier,
  validationBrouillonCommentaireAPublier,
} from "@/validation/commentaire";
import { getContainer } from "@/server/dependances";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const commentaireRouter = createTRPCRouter({
  publier: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationCommentaireContexte),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  enregistrerEnBrouillon: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationCommentaireContexte),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  modifier: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationCommentaireAModifier),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  publierUnBrouillon: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationBrouillonCommentaireAPublier),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  modifierLeBrouillon: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationCommentaireFormulaire)
        .merge(validationBrouillonCommentaireAPublier),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  recupererHistorique: protectedProcedure
    .input(validationCommentaireContexte)
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(
        input.chantierId,
        input.territoireCode,
      );
      return getContainer("commentaires")
        .resolve("recupererHistoriqueCommentaireQuery")
        .run(input.chantierId, input.territoireCode, input.type);
    }),
});
