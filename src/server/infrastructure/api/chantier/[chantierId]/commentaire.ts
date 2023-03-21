import { NextApiRequest, NextApiResponse } from 'next';
import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import logger from '@/server/infrastructure/logger';
import PosterUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/PosterUnNouveauCommentaireUseCase';

class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, typeDeCommentaire: TypeCommentaire } {
  const chantierId = request.query.chantierId as string;
  const typeDeCommentaire = request.query.typeDeCommentaire as TypeCommentaire;
  
  if (!chantierId || !typeDeCommentaire) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }
  
  return { chantierId, typeDeCommentaire };
}

export default async function handlePostCommentaire(request: NextApiRequest, response: NextApiResponse, posterUnNouveauCommentaire = new PosterUnNouveauCommentaireUseCase(),
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
  const détailsCommentaire: DétailsCommentaire = request.body.détailsCommentaire;
  await posterUnNouveauCommentaire.run(params.chantierId, params.typeDeCommentaire, détailsCommentaire);

  response.status(200);
}
