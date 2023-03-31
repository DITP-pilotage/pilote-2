import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/logger';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase
  from '@/server/usecase/synthèse/RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase';

class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, maille: Maille, codeInsee: CodeInsee } {
  const chantierId = request.query.chantierId as string;
  const maille = request.query.maille as Maille;
  const codeInsee = request.query.codeInsee as CodeInsee;

  if (!chantierId || !maille || !codeInsee) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { chantierId, maille, codeInsee };
}

export default async function handleHistoriqueDeLaSynthèseDesRésultats(
  request: NextApiRequest,
  response: NextApiResponse,
  récupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase = new RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase(),
) {
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

  const historiqueDeLaSynthèse = await récupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase.run(params.chantierId, params.maille, params.codeInsee);

  response.status(200).json(historiqueDeLaSynthèse);
}
