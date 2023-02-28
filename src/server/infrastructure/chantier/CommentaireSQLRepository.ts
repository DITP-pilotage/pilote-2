import { PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import { Commentaires } from '@/server/domain/chantier/Commentaire.interface';

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  getByChantierIdAndTerritoire(_chantierId: string, _maille: string, _codeInsee: string): Promise<Commentaires> {
    const commentaires: Commentaires = {};
    return Promise.resolve(commentaires);
  }
}
