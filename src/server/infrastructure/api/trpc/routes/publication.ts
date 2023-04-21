/* eslint-disable sonarjs/no-duplicate-string */
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
import CréerUnObjectifUseCase from '@/server/usecase/objectif/CréerUnObjectifUseCase';
import RécupérerObjectifLePlusRécentUseCase from '@/server/usecase/objectif/RécupérerObjectifLePlusRécentUseCase';
import RécupérerHistoriqueObjectifUseCase from '@/server/usecase/objectif/RécupérerHistoriqueObjectifUseCase';
import RécupérerDécisionStratégiqueLaPlusRécenteUseCase from '@/server/usecase/décision/RécupérerDécisionStratégiqueLaPlusRécenteUseCase';
import CréerUneDécisionStratégiqueUseCase from '@/server/usecase/décision/CréerUneDécisionStratégiqueUseCase';
import RécupérerHistoriqueDécisionStratégiqueUseCase from '@/server/usecase/décision/RécupérerHistoriqueDécisionStratégiqueUseCase';
import RécupérerCommentairesLesPlusRécentsParTypeUseCase from '@/server/usecase/commentaire/RécupérerCommentairesLesPlusRécentsParTypeUseCase';
import RécupérerObjectifsLesPlusRécentsParTypeUseCase from '@/server/usecase/objectif/RécupérerObjectifsLesPlusRécentsParTypeUseCase';

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

      if (input.entité === 'décisions stratégiques') {
        const créerUneDécisionStratégiqueUseCase = new CréerUneDécisionStratégiqueUseCase(dependencies.getDécisionStratégiqueRepository());
        return créerUneDécisionStratégiqueUseCase.run(input.chantierId, input.contenu, auteur);
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
        const récupérerDésionStratégiqueLaPlusRécenteUseCase = new RécupérerDécisionStratégiqueLaPlusRécenteUseCase(dependencies.getDécisionStratégiqueRepository());
        return récupérerDésionStratégiqueLaPlusRécenteUseCase.run(input.chantierId);
      }
    }),

  récupérerLaPlusRécenteParType: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input }) => {      
      if (input.entité === 'commentaires') {
        const récupérerCommentairesLesPlusRécentsParTypeUseCase = new RécupérerCommentairesLesPlusRécentsParTypeUseCase(dependencies.getCommentaireRepository());
        return récupérerCommentairesLesPlusRécentsParTypeUseCase.run(input.chantierId, input.maille, input.codeInsee);
      }

      if (input.entité === 'objectifs') {
        const récupérerObjectifsLesPlusRécentsParTypeUseCase = new RécupérerObjectifsLesPlusRécentsParTypeUseCase(dependencies.getObjectifRepository());
        return récupérerObjectifsLesPlusRécentsParTypeUseCase.run(input.chantierId);
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

      if (input.entité === 'décisions stratégiques') {
        const récupérerHistoriqueDésionStratégiqueUseCase = new RécupérerHistoriqueDécisionStratégiqueUseCase(dependencies.getDécisionStratégiqueRepository());
        return récupérerHistoriqueDésionStratégiqueUseCase.run(input.chantierId);
      }
    }),
});
