import { NextApiRequest, NextApiResponse } from 'next';
import {
  ListerDonneesIndicateurParIndicIdUseCase,
} from '@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { presenterEnDonneeIndicateurContrat } from '@/server/chantiers/app/contrats/DonneeIndicateurContrat';

export const handleListerIndicateurs = async ({ request, response } : { request: NextApiRequest, response: NextApiResponse }) => {
  const listeDonneesIndicateurs = await new ListerDonneesIndicateurParIndicIdUseCase({
    indicateurRepository: dependencies.getChantierIndicateurRepository(),
  }).run({ indicId: request.query.indicateurId as string });
  response.status(200).json(presenterEnDonneeIndicateurContrat(request.query.chantierId as string, listeDonneesIndicateurs));
};

