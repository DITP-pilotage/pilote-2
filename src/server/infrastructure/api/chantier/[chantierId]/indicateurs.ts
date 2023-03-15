import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, maille: Maille, codesInsee: CodeInsee[] } {
  const chantierId = request.query.chantierId as string;
  const maille = request.query.maille as Maille;
  let codesInsee = request.query.codesInsee as CodeInsee[];
  if (typeof codesInsee === 'string') {
    codesInsee = [codesInsee];
  }

  if (!chantierId || !maille || !Array.isArray(codesInsee)) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { chantierId, maille, codesInsee };
}

export default async function handleChantierIdIndicateurs(request: NextApiRequest, response: NextApiResponse, indicateurRepository = dependencies.getIndicateurRepository()) {
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

  const detailsIndicateurs = await indicateurRepository.récupererDétailsParChantierIdEtTerritoire(params.chantierId, params.maille, params.codesInsee);

  response.status(200).json(detailsIndicateurs);
}
