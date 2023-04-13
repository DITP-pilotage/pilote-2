import { TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentaireLePlusRécentUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire) {
    return this.commentaireRepository.récupérerLePlusRécent(chantierId, maille, codeInsee, type);
  }
}
