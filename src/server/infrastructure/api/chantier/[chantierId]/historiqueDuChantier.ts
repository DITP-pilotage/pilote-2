import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { typeCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

class ParsingError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire } {
  const chantierId = request.query.chantierId as string;
  const maille = request.query.maille as Maille;
  const codeInsee = request.query.codeInsee as CodeInsee;
  const type = request.query.type as TypeCommentaire;

  if (!chantierId || !maille || !codeInsee || !type) {
    const errorMessage = 'Le parsing de la query a échoué.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  if (!typeCommentaire.includes(type)) {
    const errorMessage = 'Paramètre invalide: type.';
    logger.info(errorMessage + ', query: %o', request.query);
    throw new ParsingError(errorMessage);
  }

  return { chantierId, maille, codeInsee, type };
}

export default async function handleChantierIdHistoriqueDuCommentaire(
  request: NextApiRequest,
  response: NextApiResponse,
  commentaireRepository = dependencies.getCommentaireRepository(),
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

  const historiqueDuCommentaire = await commentaireRepository.findAllByChantierIdAndTerritoireAndType(params.chantierId, params.maille, params.codeInsee, params.type);

  response.status(200).json(historiqueDuCommentaire);
}
