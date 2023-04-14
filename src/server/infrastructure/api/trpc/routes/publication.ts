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
  zodValidateurCSRF,
  zodValidateurEntité,
  zodValidateurEntitéType,
} from 'validation/publication';
import RécupérerCommentaireLePlusRécentUseCase from '@/server/usecase/commentaire/RécupérerCommentaireLePlusRécentUseCase';
import RécupérerHistoriqueCommentaireUseCase from '@/server/usecase/commentaire/RécupérerHistoriqueCommentaireUseCase';
import { typeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { RouterInputs, RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import CréerUnObjectifUseCase from '@/server/usecase/objectif/CréerUnObjectifUseCase';
import RécupérerObjectifLePlusRécentUseCase from '@/server/usecase/objectif/RécupérerObjectifLePlusRécentUseCase';
import RécupérerHistoriqueObjectifUseCase from '@/server/usecase/objectif/RécupérerHistoriqueObjectifUseCase';
import { typesObjectif } from '@/server/domain/objectif/Objectif.interface';
import RécupérerDécisionStratégiqueLePlusRécentUseCase from '@/server/usecase/décision/RécupérerDécisionStratégiqueLaPlusRécenteUseCase';

export const publicationRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurCSRF).and(validationPublicationFormulaire))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      if (input.entité === 'commentaires') {
        const créerUnCommentaireUseCase = new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository());
        return créerUnCommentaireUseCase.run(input.chantierId, input.maille, input.codeInsee, input.contenu, auteur, input.type);
      }

      if (input.entité === 'objectifs') {
        const créerUnObjectifUseCase = new CréerUnObjectifUseCase(dependencies.getObjectifRepository());
        return créerUnObjectifUseCase.run(input.chantierId, input.contenu, auteur, input.type);
      }
    }),
    
  récupérerLaPlusRécente: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input }) => {
      if (input.entité === 'commentaires') {
        const récupérerCommentaireLePlusRécentUseCase = new RécupérerCommentaireLePlusRécentUseCase(dependencies.getCommentaireRepository());
        return récupérerCommentaireLePlusRécentUseCase.run(input.chantierId, input.maille, input.codeInsee, input.type);
      }

      if (input.entité === 'objectifs') {
        const récupérerObjectifLePlusRécentUseCase = new RécupérerObjectifLePlusRécentUseCase(dependencies.getObjectifRepository());
        return récupérerObjectifLePlusRécentUseCase.run(input.chantierId, input.type);
      }

      if (input.entité === 'décisions stratégiques') {
        const récupérerDésionStratégiqueLaPlusRécenteUseCase = new RécupérerDécisionStratégiqueLePlusRécentUseCase(dependencies.getDécisionStratégiqueRepository());
        return récupérerDésionStratégiqueLaPlusRécenteUseCase.run(input.chantierId);
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

      if (input.entité === 'objectifs') {
        const récupérerObjectifLePlusRécentUseCase = new RécupérerObjectifLePlusRécentUseCase(dependencies.getObjectifRepository());

        for (const type of typesObjectif) {
          const objectif = await récupérerObjectifLePlusRécentUseCase.run(input.chantierId, type);
          publications.push({
            type,
            publication: objectif,
          });
        }
        return publications;
      }
    }),

  récupérerHistorique: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input }) => {
      if (input.entité === 'commentaires') {
        const récupérerHistoriqueCommentaireUseCase = new RécupérerHistoriqueCommentaireUseCase(dependencies.getCommentaireRepository());
        return récupérerHistoriqueCommentaireUseCase.run(input.chantierId, input.maille, input.codeInsee, input.type);
      } 
      
      if (input.entité === 'objectifs') {
        const récupérerHistoriqueObjectifUseCase = new RécupérerHistoriqueObjectifUseCase(dependencies.getObjectifRepository());
        return récupérerHistoriqueObjectifUseCase.run(input.chantierId, input.type);
      }
    }),
});
