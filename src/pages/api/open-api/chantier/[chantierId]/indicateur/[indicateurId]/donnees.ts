import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/Logger';
import {
  UtilisateurAuthentifieJWTService,
} from '@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  const bearerToken = request.headers['authorization'];
  const token = (bearerToken || '').split(' ')[1];
  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);
  logger.info('Export des données API', `Chantier : ${request.query.chantierId}`, `Indicateur : ${request.query.indicateurId}`);
  response.status(200).json({ resultat: `Bonjour ${utilisateurAuthentifie.email}, vous pouvez utiliser l'API.` });
}
