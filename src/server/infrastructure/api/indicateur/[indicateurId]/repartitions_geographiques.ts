import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';


class ParsingError extends Error {}

// TODO: a refactor avec les autres parseQueryParams de l'api
function parseQueryParams(request: NextApiRequest): { indicateurId: string, maille: MailleInterne } {
  const indicateurId = request.query.indicateurId as string;
  const maille = request.query.maille as MailleInterne;

  if (!indicateurId || !maille) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { indicateurId, maille };
}

export default async function handleIndicateurRépartitionsGéographiques(
  request: NextApiRequest,
  response: NextApiResponse,
  indicateurRepository = dependencies.getIndicateurRepository(),
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
  const cartographieIndicateurTerritorialisées = await indicateurRepository.getCartographieDonnéesParMailleEtIndicateurId(params.indicateurId, params.maille);
  response
    .status(200)
    .json(cartographieIndicateurTerritorialisées);
}
