import { TypeCommentaireChantier } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentaireLePlusRécentUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, territoireCode: string, type: TypeCommentaireChantier, habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);

    return this.commentaireRepository.récupérerLePlusRécent(chantierId, territoireCode, type);
  }
}
