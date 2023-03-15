import { PrismaClient, commentaire } from '@prisma/client';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif from '@/server/domain/objectif/Objectif.interface';

export default class ObjectifSQLRepository implements ObjectifRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _toDomain(objectif: commentaire | null): Objectif {
    if (objectif === null || objectif.contenu === '')
      return null;

    return {
      contenu: objectif.contenu,
      date: objectif.date.toISOString(),
      auteur: '',
    };
  }
  
  async récupérerLePlusRécent(chantierId: string): Promise<Objectif> {
    const objectif = await this.prisma.commentaire.findFirst({
      where: {
        chantier_id: chantierId,
        type: 'objectifs',
      },
      orderBy: { date: 'desc' },
    });

    return this._toDomain(objectif);
  }
}
