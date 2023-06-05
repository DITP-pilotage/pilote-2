import { dependencies } from '@/server/infrastructure/Dependencies';
import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import { Commentaire, TypeCommentaireChantier } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerHistoriqueCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, territoireCode: string, type: TypeCommentaireChantier, habilitations: Habilitations): Promise<Commentaire[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    
    return this.commentaireRepository.récupérerHistorique(chantierId, territoireCode, type);
  }
}
