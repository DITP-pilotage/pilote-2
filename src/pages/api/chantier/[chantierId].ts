import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';


// GET /api/chantier/:idChantier:?codeInsee=:codeinsee:&maille=:nomdelamaille:

class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, maille: string, codeInsee: string } {
  const chantierId = request.query.chantierId as string;
  const maille = request.query.maille as string;
  const codeInsee = request.query.codeInsee as string;

  if (!chantierId || !maille || !codeInsee) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { chantierId, maille, codeInsee };
}

export default async function handle(request: NextApiRequest, response: NextApiResponse, chantierRepository = dependencies.getChantierRepository()) {
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
  const metriquesChantier = await chantierRepository.getMétriques(params.chantierId, params.maille, params.codeInsee);
  response
    .status(200)
    .json(metriquesChantier);
}
