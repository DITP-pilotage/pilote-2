import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';

class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, indicateurId: string, maille: string, codeInsee: string } {
  const chantierId = request.query.chantier_id as string;
  const indicateurId = request.query.indicateur_id as string;
  const maille = request.query.maille as string;
  const codeInsee = request.query.code_insee as string;

  if (!chantierId || !indicateurId || !maille || !codeInsee) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { chantierId, indicateurId, maille, codeInsee };
}

export default async function handle(request: NextApiRequest, response: NextApiResponse, indicateurRepository = dependencies.getIndicateurRepository()) {
  let params;
  try {
    params = parseQueryParams(request);
  } catch (error) {
    if (error instanceof ParsingError) {
      response.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
  const evolutionIndicateur = await indicateurRepository.getDetailsIndicateur(params.chantierId, params.indicateurId, params.maille, params.codeInsee);
  response
    .status(200)
    .json(evolutionIndicateur);
}
