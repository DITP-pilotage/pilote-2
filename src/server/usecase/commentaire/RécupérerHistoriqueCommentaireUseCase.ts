import { dependencies } from '@/server/infrastructure/Dependencies';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default class RécupérerHistoriqueCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire[]> {
    return this.commentaireRepository.récupérerHistoriqueDUnCommentaire(chantierId, maille, codeInsee, type);
  }
}
