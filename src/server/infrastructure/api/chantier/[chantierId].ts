import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/logger';
import {
  RécupérerLeDétailDUnChantierTerritorialiséeUseCase,
} from '@/server/usecase/chantier/RécupérerLeDétailDUnChantierTerritorialiséeUseCase';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

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

export default async function handleChantierId(
  request: NextApiRequest,
  response: NextApiResponse,
  récupérerLeDétailDUnChantierTerritorialiséeUseCase = new RécupérerLeDétailDUnChantierTerritorialiséeUseCase(),
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

  const infosChantier = await récupérerLeDétailDUnChantierTerritorialiséeUseCase.run(params.chantierId, params.maille, params.codeInsee);

  response
    .status(200)
    .json(infosChantier);
}
