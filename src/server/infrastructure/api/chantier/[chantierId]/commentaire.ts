import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import logger from '@/server/infrastructure/logger';
import CréerUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/CréerUnNouveauCommentaireUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { CommentaireÀCréer } from '@/server/domain/commentaire/Commentaire.interface';
import { limiteCaractèresCommentaire } from '@/server/domain/commentaire/Commentaire.validator';


class ParsingError extends Error {}
class HttpMéthodeError extends Error {}
class CommentaireParamsError extends Error {}
class ConnectionUtilisateurError extends Error {}

function parseQueryParams(request: NextApiRequest): { chantierId: string } {
  const chantierId = request.query.chantierId as string | undefined;

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

async function vérifierLeCommentaire(request: NextApiRequest) {
  const commentaire = request.body;

  if (!commentaire.typeCommentaire || !commentaire.maille || !commentaire.codeInsee || !commentaire.contenu) {    
    throw new CommentaireParamsError('Le commentaire est imcomplet');
  }

  if (commentaire.contenu.length > limiteCaractèresCommentaire) {
    throw new CommentaireParamsError('Le contenu du commentaire dépasse la limite de caractères');
  }
  return commentaire;
}

async function vérifierLaConnexionDeLUtilisateur(request: NextApiRequest, response: NextApiResponse, serverSession: typeof getServerSession) {
  const session = await serverSession(request, response, authOptions);
  if (!session || !session.user) {       
     
    throw new ConnectionUtilisateurError('Utilisateur non authentifié');
  }
  return session.user;
}

export default async function handlePublierCommentaire(request: NextApiRequest, response: NextApiResponse, serverSession = getServerSession, publierUnNouveauCommentaire = new CréerUnNouveauCommentaireUseCase()) {  
  try {    
    vérifierLaMéthodeHttp(request);
    const params = parseQueryParams(request);
    const utilisateur = await vérifierLaConnexionDeLUtilisateur(request, response, serverSession);
    const nouveauCommentaire: CommentaireÀCréer = await vérifierLeCommentaire(request);    
    const résultat = await publierUnNouveauCommentaire.run(params.chantierId, nouveauCommentaire, utilisateur?.name as string);
    response.status(200).json(résultat);
  } catch (error) { 
    if (error instanceof HttpMéthodeError) {
      response.status(405).json({ error: error.message });
    } else if (error instanceof ParsingError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof CommentaireParamsError) {      
      response.status(400).json({ error: error.message });
    } else if (error instanceof ConnectionUtilisateurError) {
      response.status(401).json({ error: error.message });
    } else {
      response.status(500).end();
    }
  }
}
