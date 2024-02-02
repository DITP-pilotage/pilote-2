import { TypeCommentaireChantier } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerCommentaireLePlusRécentUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository,
  ) {}

  async run(chantierId: string, territoireCode: string, type: TypeCommentaireChantier, habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);

    return this.commentaireRepository.récupérerLePlusRécent(chantierId, territoireCode, type);
  }
}
