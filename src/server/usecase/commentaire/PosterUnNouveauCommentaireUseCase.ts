import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class PosterUnNouveauCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, typeDeCommentaire: TypeCommentaire, détailsCommentaire: DétailsCommentaire) {
    await this.commentaireRepository.postNouveauCommentaire(chantierId, typeDeCommentaire, détailsCommentaire);
  }
}
