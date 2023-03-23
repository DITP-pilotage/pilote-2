import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/server/infrastructure/logger';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { typeCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import RécupérerLHistoriqueDuCommentaireUseCase
  from '@/server/usecase/commentaire/RécupérerLHistoriqueDuCommentaireUseCase';

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

export default async function handleHistoriqueDuCommentaire(
  request: NextApiRequest,
  response: NextApiResponse,
  récupérerLHistoriqueDuCommentaireUseCase = new RécupérerLHistoriqueDuCommentaireUseCase(),
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

  const historiqueDuCommentaire = await récupérerLHistoriqueDuCommentaireUseCase.run(params.chantierId, params.maille, params.codeInsee, params.type);

  response.status(200).json(historiqueDuCommentaire);
}
