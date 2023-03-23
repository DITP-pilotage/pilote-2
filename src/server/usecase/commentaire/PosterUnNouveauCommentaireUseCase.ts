import { NouveauCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class PosterUnNouveauCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, nouveauCommentaire: NouveauCommentaire) {
    this.commentaireRepository.postNouveauCommentaire(
      chantierId, 
      nouveauCommentaire.typeCommentaire, 
      nouveauCommentaire.maille, 
      nouveauCommentaire.codeInsee, 
      nouveauCommentaire.détailsCommentaire,
    );
  }
}
