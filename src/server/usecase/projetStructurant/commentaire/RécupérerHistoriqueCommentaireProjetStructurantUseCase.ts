import CommentaireProjetStructurant, { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerHistoriqueCommentaireProjetStructurantUseCase {
  constructor(
    private readonly commentaireProjetStructurantRepository: CommentaireProjetStructurantRepository = dependencies.getCommentaireProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string, type: TypeCommentaireProjetStructurant, habilitations: Habilitations): Promise<CommentaireProjetStructurant[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);

    return this.commentaireProjetStructurantRepository.récupérerHistorique(projetStructurantId, type);
  }
}
