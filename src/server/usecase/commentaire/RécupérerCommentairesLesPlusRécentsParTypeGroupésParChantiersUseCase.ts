import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierIds: string[], territoireCode: string, habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    chantierIds.forEach(chantierId => {
      habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    });
    
    return this.commentaireRepository.récupérerLesPlusRécentsGroupésParChantier(chantierIds, territoireCode);
  }
}
