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
import { déterminerLeTypeDeRéforme } from '@/server/utils/réforme';
import RécupérerObjectifProjetStructurantLePlusRécentUseCase from '@/server/usecase/projetStructurant/objectif/RécupérerObjectifLePlusRécentUseCase';
import { TypeObjectifChantier } from '@/server/domain/objectif/Objectif.interface';
import RécupérerCommentaireProjetStructurantLePlusRécentUseCase from '@/server/usecase/projetStructurant/commentaire/RécupérerCommentaireLePlusRécentUseCase';
import { TypeCommentaireChantier } from '@/server/domain/commentaire/Commentaire.interface';
import { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParProjetStructurantsUseCase from '@/server/usecase/projetStructurant/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParProjetStructurantsUseCase';

export const publicationRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurCSRF).and(validationPublicationFormulaire))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';   
      
      if (input.entité === 'commentaires') {
        const créerUnCommentaireUseCase = new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository());
        return créerUnCommentaireUseCase.run(input.réformeId, input.territoireCode, input.contenu, auteur, input.type as TypeCommentaireChantier, ctx.session.habilitations);
      }
        
      if (input.entité === 'objectifs') {
        const créerUnObjectifUseCase = new CréerUnObjectifUseCase(dependencies.getObjectifRepository());
        return créerUnObjectifUseCase.run(input.réformeId, input.contenu, auteur, input.type as TypeObjectifChantier, ctx.session.habilitations);
      }
        
      if (input.entité === 'décisions stratégiques') {
        const créerUneDécisionStratégiqueUseCase = new CréerUneDécisionStratégiqueUseCase(dependencies.getDécisionStratégiqueRepository());
        return créerUneDécisionStratégiqueUseCase.run(input.réformeId, input.contenu, auteur, ctx.session.habilitations);
      }
    }),
    
  récupérerLaPlusRécente: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      const typeDeRéforme = déterminerLeTypeDeRéforme(input.réformeId);

      if (typeDeRéforme === 'chantier') {
        if (input.entité === 'commentaires') {
          const récupérerCommentaireLePlusRécentUseCase = new RécupérerCommentaireLePlusRécentUseCase(dependencies.getCommentaireRepository());
          return récupérerCommentaireLePlusRécentUseCase.run(input.réformeId, input.territoireCode, input.type as TypeCommentaireChantier, ctx.session.habilitations);
        }

        if (input.entité === 'objectifs') {
          const récupérerObjectifLePlusRécentUseCase = new RécupérerObjectifLePlusRécentUseCase(dependencies.getObjectifRepository());
          return récupérerObjectifLePlusRécentUseCase.run(input.réformeId, input.type as TypeObjectifChantier, ctx.session.habilitations);
        }

        if (input.entité === 'décisions stratégiques') {
          const récupérerDésionStratégiqueLaPlusRécenteUseCase = new RécupérerDécisionStratégiqueLaPlusRécenteUseCase(dependencies.getDécisionStratégiqueRepository());
          return récupérerDésionStratégiqueLaPlusRécenteUseCase.run(input.réformeId, ctx.session.habilitations);
        }
      } else if (typeDeRéforme === 'projet structurant') {
        if (input.entité === 'commentaires') {
          const récupérerCommentaireLePlusRécentUseCase = new RécupérerCommentaireProjetStructurantLePlusRécentUseCase(dependencies.getCommentaireProjetStructurantRepository());
          return récupérerCommentaireLePlusRécentUseCase.run(input.réformeId, input.type as TypeCommentaireProjetStructurant);
        }
      
        if (input.entité === 'objectifs') {
          const récupérerObjectifLePlusRécentUseCase = new RécupérerObjectifProjetStructurantLePlusRécentUseCase(dependencies.getObjectifProjetStructurantRepository());
          return récupérerObjectifLePlusRécentUseCase.run(input.réformeId);
        }
      }
    }), 

  récupérerLesPlusRécentesParTypeGroupéesParRéformes: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input, ctx }) => {
      const typeDeRéforme = déterminerLeTypeDeRéforme(input.réformeId);

      if (input.entité === 'commentaires') {
        if (typeDeRéforme === 'chantier') {
          const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getCommentaireRepository());
          return récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([input.réformeId], input.territoireCode, ctx.session.habilitations);
        }

        if (typeDeRéforme === 'projet structurant') {
          const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerCommentairesLesPlusRécentsParTypeGroupésParProjetStructurantsUseCase(dependencies.getCommentaireProjetStructurantRepository());
          return récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([input.réformeId]);
        }
      }

      if (input.entité === 'objectifs') {
        const récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getObjectifRepository());
        return récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase.run([input.réformeId], ctx.session.habilitations);
      }
    }),

  récupérerHistorique: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === 'commentaires') {
        const récupérerHistoriqueCommentaireUseCase = new RécupérerHistoriqueCommentaireUseCase(dependencies.getCommentaireRepository());
        return récupérerHistoriqueCommentaireUseCase.run(input.réformeId, input.territoireCode, input.type as TypeCommentaireChantier, ctx.session.habilitations);
      } 
  
      if (input.entité === 'objectifs') {
        const récupérerHistoriqueObjectifUseCase = new RécupérerHistoriqueObjectifUseCase(dependencies.getObjectifRepository());
        return récupérerHistoriqueObjectifUseCase.run(input.réformeId, input.type as TypeObjectifChantier, ctx.session.habilitations);
      }
  
      if (input.entité === 'décisions stratégiques') {
        const récupérerHistoriqueDésionStratégiqueUseCase = new RécupérerHistoriqueDécisionStratégiqueUseCase(dependencies.getDécisionStratégiqueRepository());
        return récupérerHistoriqueDésionStratégiqueUseCase.run(input.réformeId, ctx.session.habilitations);
      }
    }),
});
