import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository,
  ) {}

  async run(chantierIds: string[], territoireCode: string, habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    chantierIds.forEach(chantierId => {
      habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    });
    
    return this.commentaireRepository.récupérerLesPlusRécentsGroupésParChantier(chantierIds, territoireCode);
  }
}
