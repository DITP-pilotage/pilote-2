import CommentaireProjetStructurant, { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerHistoriqueCommentaireProjetStructurantUseCase {
  constructor(
    private readonly commentaireProjetStructurantRepository: CommentaireProjetStructurantRepository = dependencies.getCommentaireProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string, type: TypeCommentaireProjetStructurant): Promise<CommentaireProjetStructurant[]> {
    return this.commentaireProjetStructurantRepository.récupérerHistorique(projetStructurantId, type);
  }
}
