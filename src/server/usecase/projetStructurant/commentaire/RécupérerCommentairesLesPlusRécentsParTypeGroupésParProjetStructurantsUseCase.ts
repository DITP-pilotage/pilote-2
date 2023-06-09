import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentairesLesPlusRécentsParTypeGroupésParProjetStructurantsUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireProjetStructurantRepository = dependencies.getCommentaireProjetStructurantRepository(),
  ) {}

  async run(projetStructurantIds: ProjetStructurant['id'][], habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    projetStructurantIds.forEach(projetStructurantId => {
      habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    });
    
    return this.commentaireRepository.récupérerLesPlusRécentsGroupésParProjetsStructurants(projetStructurantIds);
  }
}
