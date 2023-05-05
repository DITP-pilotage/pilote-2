import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierIds: string[], maille: Maille, codeInsee: CodeInsee) {
    return this.commentaireRepository.récupérerLesPlusRécentsGroupésParChantier(chantierIds, maille, codeInsee);
  }
}
