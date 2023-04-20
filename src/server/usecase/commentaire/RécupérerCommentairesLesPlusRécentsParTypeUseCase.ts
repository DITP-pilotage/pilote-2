import { Commentaire, TypeCommentaire, typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentairesLesPlusRécentsParTypeUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee) {
    const commentaires: { type: TypeCommentaire, publication: Commentaire }[] = [];
    const types = maille === 'nationale' ? typesCommentaireMailleNationale : typesCommentaireMailleRégionaleOuDépartementale;

    for (const type of types) {
      const commentaire = await this.commentaireRepository.récupérerLePlusRécent(chantierId, maille, codeInsee, type);
      commentaires.push({
        type,
        publication: commentaire,
      });
    }
    return commentaires;
  }
}
