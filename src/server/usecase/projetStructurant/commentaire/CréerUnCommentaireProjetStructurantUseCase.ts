import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
// import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';

export default class CréerUnCommentaireProjetStructurantUseCase {
  constructor(
    private readonly commentaireProjetStructurantRepository: CommentaireProjetStructurantRepository = dependencies.getCommentaireProjetStructurantRepository(),
  ) {}

  async run(ProjetStructurantId: string, contenu: string, auteur: string, type: TypeCommentaireProjetStructurant) {
    // const habilitation = new Habilitation(habilitations);
    // habilitation.vérifierLesHabilitationsEnSaisieDesPublications(ProjetStructurantId, territoireCode);
    
    const date = new Date();
    const id = randomUUID();
    return this.commentaireProjetStructurantRepository.créer(ProjetStructurantId, id, contenu, auteur, type, date);
  }
}
