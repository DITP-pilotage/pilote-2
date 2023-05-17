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
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from '@/server/usecase/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from '@/server/usecase/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase';

export const publicationRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurCSRF).and(validationPublicationFormulaire))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      if (input.entité === 'commentaires') {
        const créerUnCommentaireUseCase = new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository());
        return créerUnCommentaireUseCase.run(input.chantierId, input.territoireCode, input.contenu, auteur, input.type, ctx.session.habilitations);
      }

      if (input.entité === 'objectifs') {
        const créerUnObjectifUseCase = new CréerUnObjectifUseCase(dependencies.getObjectifRepository());
        return créerUnObjectifUseCase.run(input.chantierId, input.contenu, auteur, input.type, ctx.session.habilitations);
      }

      if (input.entité === 'décisions stratégiques') {
        const créerUneDécisionStratégiqueUseCase = new CréerUneDécisionStratégiqueUseCase(dependencies.getDécisionStratégiqueRepository());
        return créerUneDécisionStratégiqueUseCase.run(input.chantierId, input.contenu, auteur, ctx.session.habilitations);
      }
    }),
    
  récupérerLaPlusRécente: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === 'commentaires') {
        const récupérerCommentaireLePlusRécentUseCase = new RécupérerCommentaireLePlusRécentUseCase(dependencies.getCommentaireRepository());
        return récupérerCommentaireLePlusRécentUseCase.run(input.chantierId, input.territoireCode, input.type, ctx.session.habilitations);
      }

      if (input.entité === 'objectifs') {
        const récupérerObjectifLePlusRécentUseCase = new RécupérerObjectifLePlusRécentUseCase(dependencies.getObjectifRepository());
        return récupérerObjectifLePlusRécentUseCase.run(input.chantierId, input.type, ctx.session.habilitations);
      }

      if (input.entité === 'décisions stratégiques') {
        const récupérerDésionStratégiqueLaPlusRécenteUseCase = new RécupérerDécisionStratégiqueLaPlusRécenteUseCase(dependencies.getDécisionStratégiqueRepository());
        return récupérerDésionStratégiqueLaPlusRécenteUseCase.run(input.chantierId, ctx.session.habilitations);
      }
    }),

  récupérerLesPlusRécentesParTypeGroupéesParChantiers: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input, ctx }) => {      
      if (input.entité === 'commentaires') {
        const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getCommentaireRepository());
        return récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([input.chantierId], input.territoireCode, ctx.session.habilitations);
      }

      if (input.entité === 'objectifs') {
        const récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getObjectifRepository());
        return récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase.run([input.chantierId], ctx.session.habilitations);
      }
    }),

  récupérerHistorique: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === 'commentaires') {
        const récupérerHistoriqueCommentaireUseCase = new RécupérerHistoriqueCommentaireUseCase(dependencies.getCommentaireRepository());
        return récupérerHistoriqueCommentaireUseCase.run(input.chantierId, input.territoireCode, input.type, ctx.session.habilitations);
      } 
      
      if (input.entité === 'objectifs') {
        const récupérerHistoriqueObjectifUseCase = new RécupérerHistoriqueObjectifUseCase(dependencies.getObjectifRepository());
        return récupérerHistoriqueObjectifUseCase.run(input.chantierId, input.type, ctx.session.habilitations);
      }

      if (input.entité === 'décisions stratégiques') {
        const récupérerHistoriqueDésionStratégiqueUseCase = new RécupérerHistoriqueDécisionStratégiqueUseCase(dependencies.getDécisionStratégiqueRepository());
        return récupérerHistoriqueDésionStratégiqueUseCase.run(input.chantierId, ctx.session.habilitations);
      }
    }),
});
