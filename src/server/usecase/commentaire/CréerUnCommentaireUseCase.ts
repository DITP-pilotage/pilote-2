import { randomUUID } from 'node:crypto';
import { TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class CréerUnCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee, contenu: string, auteur: string, type: TypeCommentaire) {
    const date = new Date();
    const id = randomUUID();
    return this.commentaireRepository.créer(chantierId, maille, codeInsee, id, contenu, auteur, type, date);
  }
}
