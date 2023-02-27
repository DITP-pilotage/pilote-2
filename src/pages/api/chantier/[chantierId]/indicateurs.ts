import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, maille: string, codesInsee: string[] } {
  const chantierId = request.query.chantierId as string;
  const maille = request.query.maille as string;
  const codesInsee = request.query.codesInsee as string[];

  if (!chantierId || !maille || !Array.isArray(codesInsee)) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { chantierId, maille, codesInsee };
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
  const detailsIndicateur = await indicateurRepository.getDetailsIndicateur(params.chantierId, params.maille, params.codesInsee);
  response
    .status(200)
    .json(detailsIndicateur);
}
