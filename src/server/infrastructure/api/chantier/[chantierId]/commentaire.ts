import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import logger from '@/server/infrastructure/logger';
import CréerUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/CréerUnNouveauCommentaireUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { CommentaireÀCréer, DétailsCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

class ParsingError extends Error {}
class HttpMéthodeError extends Error {}
export class CommentaireParamsError extends Error {}
class ConnectionUtilisateurError extends Error {}
class CSRFError extends Error {}

function récupérerQueryParams(request: NextApiRequest): { chantierId: string } {
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

async function récupérerLUtilisateur(request: NextApiRequest, response: NextApiResponse, serverSession: typeof getServerSession) {
  const session = await serverSession(request, response, authOptions);

  if (!session?.user) {       
    throw new ConnectionUtilisateurError('Utilisateur non authentifié');
  }

  return session.user;
}

function vérifierLeCSRF(request: NextApiRequest) {
  const bodyParsé = JSON.parse(request.body) as any; 
  const csfrCookie = request.cookies.csrf;
  const csrfBody = bodyParsé.csrf;

  if (!csfrCookie || !csrfBody) {
    throw new CSRFError("Le cookie CSRF n'existe pas ou il n'est pas correctement soumis");
  }

  if (csfrCookie !== csrfBody) {
    throw new CSRFError('Le CSRF est invalide');
  }
}

export default async function handleCréerCommentaire(request: NextApiRequest, response: NextApiResponse, serverSession = getServerSession, créerUnNouveauCommentaire = new CréerUnNouveauCommentaireUseCase()) {  
  try { 
    vérifierLaMéthodeHttp(request);
    vérifierLeCSRF(request);
    const params = récupérerQueryParams(request);
    const utilisateur = await récupérerLUtilisateur(request, response, serverSession);
    const bodyParsé = JSON.parse(request.body) as any; 
    const nouveauCommentaire: CommentaireÀCréer = bodyParsé.commentaireÀCréer;
    const détailsCommentaireCréé: DétailsCommentaire = await créerUnNouveauCommentaire.run(params.chantierId, nouveauCommentaire, utilisateur.name!);
    response.status(200).json(détailsCommentaireCréé);
  } catch (error) { 
    if (error instanceof HttpMéthodeError) {
      response.status(405).json({ error: error.message });
    } else if (error instanceof ParsingError || error instanceof CSRFError || error instanceof CommentaireParamsError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof ConnectionUtilisateurError) {
      response.status(401).json({ error: error.message });
    } else {
      response.status(500).json({});
    }
  }
}
