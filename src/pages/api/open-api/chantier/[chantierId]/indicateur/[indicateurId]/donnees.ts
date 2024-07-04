import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/Logger';
import {
  UtilisateurAuthentifieJWTService,
} from '@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { handleListerIndicateurs } from '@/server/chantiers/infrastructure/handlers/ListerIndicateursHandler';
import {
  handleImportDonneeIndicateurAPI,
} from '@/server/import-indicateur/infrastructure/handlers/ImportDonneeIndicateurAPIHandler';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  const bearerToken = request.headers['authorization'];

  const token = (bearerToken || '').split(' ')[1];
  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);


  switch (request.method) {
    case 'GET': {
      logger.info('Export des données API', `Chantier : ${request.query.chantierId}`, `Indicateur : ${request.query.indicateurId}`);
      if (!utilisateurAuthentifie.peutAccederAuChantier(request.query.chantierId as string)) {
        response.status(403).json({ message: `Vous n'êtes pas autorisé à acceder au chantier ${request.query.chantierId}` });
      }
      await handleListerIndicateurs({ request, response });
      break;
    }
    case 'POST': {
      logger.info('Import des données API', `Chantier : ${request.query.chantierId}`, `Indicateur : ${request.query.indicateurId}`);
      if (!utilisateurAuthentifie.peutAccederEnEcritureAuChantier(request.query.chantierId as string)) {
        response.status(403).json({ message: `Vous n'êtes pas autorisé à acceder au chantier ${request.query.chantierId}` });
      }
      await handleImportDonneeIndicateurAPI({ request, response, email: utilisateurAuthentifie.email, profil: utilisateurAuthentifie.profil });
      break;
    }
    default: {
      response.status(400).json({ message: 'Bad request 2' });
    }
  }
}
