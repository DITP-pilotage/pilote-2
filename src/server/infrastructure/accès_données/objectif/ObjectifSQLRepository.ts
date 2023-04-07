import { PrismaClient, objectif as ObjectifPrisma, commentaire } from '@prisma/client';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif from '@/server/domain/objectif/Objectif.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { CODES_TYPES_COMMENTAIRES } from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';

export default class ObjectifSQLRepository implements ObjectifRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(objectif: ObjectifPrisma | null): Objectif {
    if (objectif === null || objectif.contenu === '')
      return null;

    return {
      contenu: objectif.contenu,
      date: objectif.date.toISOString(),
      auteur: '',
    };
  }
  
  async récupérerLePlusRécent(chantierId: string): Promise<Objectif> {
    const objectifTrouvé = await this.prisma.objectif.findFirst({
      where: {
        chantier_id: chantierId,
        type: undefined,
      },
      orderBy: { date: 'desc' },
    });

    return this.mapperVersDomaine(objectifTrouvé);
  }

  async récupérerHistoriqueDUnObjectif(chantierId: string): Promise<Objectif[]> {
    const objectifs: ObjectifPrisma[] = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
      },
      orderBy: { date: 'desc' },
    });

    return objectifs.map(objectifDeLHistorique => this.mapperVersDomaine(objectifDeLHistorique));
  }
}
