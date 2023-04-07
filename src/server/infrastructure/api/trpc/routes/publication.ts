import { z } from 'zod';
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import CréerUnCommentaireUseCase from '@/server/usecase/commentaire/CréerUnCommentaireUseCase';
import {
  validationPublicationContexte,
  validationPublicationFormulaire,
  zodValidateurEntité,
  zodValidateurEntitéType,
} from 'validation/publication';
import RécupérerCommentaireLePlusRécentUseCase from '@/server/usecase/commentaire/RécupérerCommentaireLePlusRécentUseCase';
import RécupérerHistoriqueCommentaireUseCase from '@/server/usecase/commentaire/RécupérerHistoriqueCommentaireUseCase';
import { typeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { RouterInputs, RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const publicationRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurCSRF).and(validationPublicationFormulaire))
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      if (input.entité === 'commentaires') {
        const créerUnCommentaireUseCase = new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository());
        return créerUnCommentaireUseCase.run(input.chantierId, input.maille, input.codeInsee, input.contenu, auteur, input.type);
      }
    }),
    
  récupérerLaPlusRécente: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(({ input }) => {
      if (input.entité === 'commentaires') {
        const récupérerCommentaireLePlusRécentUseCase = new RécupérerCommentaireLePlusRécentUseCase(dependencies.getCommentaireRepository());
        return récupérerCommentaireLePlusRécentUseCase.run(input.chantierId, input.maille, input.codeInsee, input.type);
      }
    }),

  récupérerLaPlusRécenteParType: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input }) => {
      const publications: { type: RouterInputs['publication']['récupérerLaPlusRécente']['type'], publication: RouterOutputs['publication']['récupérerLaPlusRécente'] }[] = [];
      if (input.entité === 'commentaires') {
        const récupérerCommentaireLePlusRécentUseCase = new RécupérerCommentaireLePlusRécentUseCase(dependencies.getCommentaireRepository());

        for (const type of typeCommentaire) {
          const commentaire = await récupérerCommentaireLePlusRécentUseCase.run(input.chantierId, input.maille, input.codeInsee, type);
          publications.push({
            type,
            publication: commentaire,
          });
        }
        return publications;
      }
    }),

  récupérerHistorique: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(({ input }) => {
      if (input.entité === 'commentaires') {
        const récupérerHistoriqueCommentaireUseCase = new RécupérerHistoriqueCommentaireUseCase(dependencies.getCommentaireRepository());
        return récupérerHistoriqueCommentaireUseCase.run(input.chantierId, input.maille, input.codeInsee, input.type);
      }
    }),
});
