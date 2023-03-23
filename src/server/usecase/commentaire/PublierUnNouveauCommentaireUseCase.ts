import { CommentaireÀPublier } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class PublierUnNouveauCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}
    
  async run(chantierId: string, nouveauCommentaire: CommentaireÀPublier, utilisateurNom: string) {
    const date = new Date().toISOString();
    return this.commentaireRepository.postNouveauCommentaire(
      chantierId, 
      nouveauCommentaire.typeCommentaire,
      nouveauCommentaire.maille,
      nouveauCommentaire.codeInsee,
      nouveauCommentaire.contenu,
      utilisateurNom,
      date,
    );
  }
}
