import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/Logger';
import {
  UtilisateurAuthentifieJWTService,
} from '@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  ListerDonneesIndicateurParIndicIdUseCase,
} from '@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase';
import { presenterEnDonneeIndicateurContrat } from '@/server/chantiers/app/contrats/DonneeIndicateurContrat';

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  const bearerToken = request.headers['authorization'];
  const token = (bearerToken || '').split(' ')[1];
  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);
  logger.info('Export des données API', `Chantier : ${request.query.chantierId}`, `Indicateur : ${request.query.indicateurId}`);

  if (!utilisateurAuthentifie.peutAccederAuChantier(request.query.chantierId as string)) {
    response.status(403).json({ message: `Vous n'êtes pas autorisé à acceder au chantier ${request.query.chantierId}` });
  }

  const listeDonneesIndicateurs = await new ListerDonneesIndicateurParIndicIdUseCase({
    indicateurRepository: dependencies.getChantierIndicateurRepository(),
  }).run({ indicId: request.query.indicateurId as string });

  response.status(200).json(presenterEnDonneeIndicateurContrat(request.query.chantierId as string, listeDonneesIndicateurs));
}
