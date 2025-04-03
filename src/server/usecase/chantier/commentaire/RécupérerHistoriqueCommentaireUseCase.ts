import { CommentaireRepository } from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import { Commentaire, TypeCommentaireChantier } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';

type Dependencies = {
  commentaireRepository: CommentaireRepository;
};

export class RécupérerHistoriqueCommentaireUseCase {
  private readonly commentaireRepository: CommentaireRepository;

  constructor({ commentaireRepository }: Dependencies) {
    this.commentaireRepository = commentaireRepository;
  }

  async run(chantierId: string, territoireCode: string, type: TypeCommentaireChantier, habilitations: Habilitations): Promise<Commentaire[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    
    return this.commentaireRepository.récupérerHistorique(chantierId, territoireCode, type);
  }
}
