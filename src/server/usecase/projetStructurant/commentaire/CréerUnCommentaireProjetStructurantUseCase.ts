import { randomUUID } from 'node:crypto';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import CommentaireProjetStructurantRepository
  from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class CréerUnCommentaireProjetStructurantUseCase {
  constructor(
    private readonly commentaireProjetStructurantRepository: CommentaireProjetStructurantRepository,
  ) {}

  async run(ProjetStructurantId: string, territoireCode: string, contenu: string, auteur: string, type: TypeCommentaireProjetStructurant, habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublicationsProjetsStructurants(territoireCode);
    
    const date = new Date();
    const id = randomUUID();
    return this.commentaireProjetStructurantRepository.créer(ProjetStructurantId, id, contenu, auteur, type, date);
  }
}
