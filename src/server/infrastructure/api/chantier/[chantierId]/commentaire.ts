import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/logger';
import PosterUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/PosterUnNouveauCommentaireUseCase';

class ParsingError extends Error {}
class HttpMéthodeError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string } {
  const chantierId = request.query.chantierId as string;

  if (!chantierId) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }
  
  return { chantierId };
}

function vérifierLaMéthodeHttp(request: NextApiRequest) {
  if (request.method !== 'POST') {
    throw new HttpMéthodeError('La méthode http n\'est pas autorisée');
  }
}

export default async function handlePostCommentaire(request: NextApiRequest, response: NextApiResponse, posterUnNouveauCommentaire = new PosterUnNouveauCommentaireUseCase(),
) {
  try {
    vérifierLaMéthodeHttp(request);
    const params = parseQueryParams(request);
    const body = JSON.parse(request.body);
    const res = await posterUnNouveauCommentaire.run(params.chantierId, body);
    response.status(200).json(res);
  } catch (error) { 
    if (error instanceof HttpMéthodeError) {
      response.status(405).json({ error: error.message });
    } else if (error instanceof ParsingError) {
      response.status(400).json({ error: error.message });
    } else {
      response.status(500).end();
    }
  }
}
