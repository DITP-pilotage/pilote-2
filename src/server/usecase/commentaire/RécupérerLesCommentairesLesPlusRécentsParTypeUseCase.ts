import { Commentaires } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerLesCommentairesLesPlusRécentsParTypeUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee):Promise<Commentaires> {
    return this.commentaireRepository.récupérerLesPlusRécentsParType(chantierId, maille, codeInsee);
  }
}
