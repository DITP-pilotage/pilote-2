import { PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import { Commentaires, commentairesNull } from '@/server/domain/chantier/Commentaire.interface';

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  getByChantierIdAndTerritoire(_chantierId: string, _maille: string, _codeInsee: string): Promise<Commentaires> {
    return Promise.resolve(commentairesNull);
  }
}
