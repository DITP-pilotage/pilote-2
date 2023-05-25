import { randomUUID } from 'node:crypto';
import { TypeCommentaireChantier } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class CréerUnCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, territoireCode: string, contenu: string, auteur: string, type: TypeCommentaireChantier, habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(chantierId, territoireCode);
    
    const date = new Date();
    const id = randomUUID();
    return this.commentaireRepository.créer(chantierId, territoireCode, id, contenu, auteur, type, date);
  }
}
