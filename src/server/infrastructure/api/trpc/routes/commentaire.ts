import { z } from 'zod';
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import CréerUnCommentaireUseCase from '@/server/usecase/commentaire/CréerUnCommentaireUseCase';
import RécupérerLesCommentairesLesPlusRécentsParTypeUseCase
  from '@/server/usecase/commentaire/RécupérerLesCommentairesLesPlusRécentsParTypeUseCase';
import { validationCommentaireContexte, validationCommentaireFormulaire } from '@/validation/commentaire';

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const commentaireRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationCommentaireContexte.merge(zodValidateurCSRF).merge(validationCommentaireFormulaire))
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      const créerUnCommentaireUseCase = new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository());
      return créerUnCommentaireUseCase.run(input.chantierId, input.maille, input.codeInsee, input.contenu, auteur, input.type);
    }),
  récupérerLesPlusRécentsParType: procédureProtégée
    .input(validationCommentaireContexte)
    .query(({ input }) => {
      const récupérerLesCommentairesLesPlusRécentsParTypeUseCase = new RécupérerLesCommentairesLesPlusRécentsParTypeUseCase(dependencies.getCommentaireRepository());
      return récupérerLesCommentairesLesPlusRécentsParTypeUseCase.run(input.chantierId, input.maille, input.codeInsee);
    }),
});
