import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/Logger';
import {
  UtilisateurAuthentifieJWTService,
} from '@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { handleListerIndicateurs } from '@/server/chantiers/infrastructure/handlers/ListerIndicateursHandler';
import { getContainer } from '@/server/dependances';
import { errorBondary } from '@/server/app/error-boundary/error-boundary';
import { ForbiddenError } from '@/server/app/error-boundary/forbidden-error';
import { BadRequestError } from '@/server/app/error-boundary/bad-request-error';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handle = async (request: NextApiRequest, response: NextApiResponse)=> {
  const bearerToken = request.headers['authorization'];

  const token = (bearerToken || '').split(' ')[1];
  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    tokenAPIRepository: dependencies.getTokenAPIInformationRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);

  switch (request.method) {
    case 'GET': {
      logger.info('API: Export des données indicateur', `Chantier : ${request.query.chantierId}`, `Indicateur : ${request.query.indicateurId}`);
      if (!utilisateurAuthentifie.peutAccederAuChantier(request.query.chantierId as string)) {
        throw new ForbiddenError(`Vous n'êtes pas autorisé à accéder à l'indicateur ${request.query.indicateurId}`);
      }
      await handleListerIndicateurs({ request, response });
      logger.info(`API: Export des données indicateur ${request.query.indicateurId} réussie`);
      break;
    }
    case 'POST': {
      logger.info('API: Import des données', `Chantier : ${request.query.chantierId}`, `Indicateur : ${request.query.indicateurId}`);
      if (!utilisateurAuthentifie.peutAccederEnEcritureAuChantier(request.query.chantierId as string)) {
        throw new ForbiddenError(`Vous n'êtes pas autorisé à accéder à l'indicateur ${request.query.indicateurId}`);
      }
      await getContainer('importIndicateur').resolve('importDonneeIndicateurAPIHandler').handle({ request, response, email: utilisateurAuthentifie.email, profil: utilisateurAuthentifie.profil });
      logger.info(`API: Import des données indicateur ${request.query.indicateurId} réussie`);
      break;
    }
    default: {
      throw new BadRequestError('Bad request');
    }
  }
};

export default errorBondary(handle);

