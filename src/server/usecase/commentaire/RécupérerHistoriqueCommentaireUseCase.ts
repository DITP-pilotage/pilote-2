import { dependencies } from '@/server/infrastructure/Dependencies';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerHistoriqueCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, territoireCode: string, type: TypeCommentaire, habilitations: Habilitations): Promise<Commentaire[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    
    return this.commentaireRepository.récupérerHistorique(chantierId, territoireCode, type);
  }
}
