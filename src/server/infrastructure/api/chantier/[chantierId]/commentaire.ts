import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import logger from '@/server/infrastructure/logger';
import PublierUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/PublierUnNouveauCommentaireUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';


class ParsingError extends Error {}
class HttpMéthodeError extends Error {}
class ConnectionUtilisateurError extends Error {}

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

async function vérifierLaConnexionDeLUtilisateur(request: NextApiRequest, response: NextApiResponse) {
  const session = await getServerSession(request, response, authOptions);
  if (!session) {
    throw new ConnectionUtilisateurError('Utilisateur non authentifié');
  }
  return session.user;
}

export default async function handlePublierCommentaire(request: NextApiRequest, response: NextApiResponse, publierUnNouveauCommentaire = new PublierUnNouveauCommentaireUseCase(),
) {
  try {
    vérifierLaMéthodeHttp(request);
    const params = parseQueryParams(request);
    const utilisateur = await vérifierLaConnexionDeLUtilisateur(request, response);
    const nouveauCommentaire = JSON.parse(request.body);
    const résultat = await publierUnNouveauCommentaire.run(params.chantierId, nouveauCommentaire, utilisateur?.name as string);
    response.status(200).json(résultat);
  } catch (error) { 
    if (error instanceof HttpMéthodeError) {
      response.status(405).json({ error: error.message });
    } else if (error instanceof ParsingError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof ConnectionUtilisateurError) {
      response.status(401).json({ error: error.message });
    } else {
      response.status(500).end();
    }
  }
}
