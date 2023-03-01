import { PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import { Commentaires, commentairesNull } from '@/server/domain/chantier/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  getByChantierIdAndTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<Commentaires> {
    return Promise.resolve(commentairesNull);
  }
}
