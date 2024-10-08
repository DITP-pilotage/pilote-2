import { NextApiRequest, NextApiResponse } from 'next';
import assert from 'node:assert';
import logger from '@/server/infrastructure/Logger';
import {
  UtilisateurAuthentifieJWTService,
} from '@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { getContainer } from '@/server/dependances';
 
export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  const bearerToken = request.headers['authorization'];
  
  assert(request.query.chantierId, 'Le chantier id est obligatoire');

  const token = (bearerToken || '').split(' ')[1];
  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);


  // eslint-disable-next-line sonarjs/no-small-switch
  switch (request.method) {
    case 'GET': {
      logger.info('Export des données chantier API', `Chantier : ${request.query.chantierId}`);
      if (!utilisateurAuthentifie.peutAccederAuChantier(request.query.chantierId as string)) {
        response.status(403).json({ message: `Vous n'êtes pas autorisé à acceder au chantier ${request.query.chantierId}` });
      }
      const donneeChantier = await getContainer().resolve('recupererDonneesChantierQuery').handle(request.query.chantierId as string, utilisateurAuthentifie.habilitations.lecture.territoires);
      response.status(200).json(donneeChantier);
      break;
    }
    default: {
      response.status(400).json({ message: 'Bad request' });
    }
  }
}
