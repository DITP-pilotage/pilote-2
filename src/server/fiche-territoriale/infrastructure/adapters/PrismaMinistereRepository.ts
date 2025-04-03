import { PrismaClient } from '@prisma/client';
import { MinistereRepository } from '@/server/fiche-territoriale/domain/ports/MinistereRepository';
import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';
import { PrismaPilote } from '@/server/db/PrismaPilote' ;

export class PrismaMinistereRepository implements MinistereRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async recupererMapMinistereParListeCodeMinistere({ listeCodeMinistere }: {
    listeCodeMinistere: string[]
  }): Promise<Map<string, Ministere>> {
    const result = await this.prisma.ministere.findMany({
      orderBy: {
        id: 'asc',
      },
      where: {
        id: {
          in: listeCodeMinistere,
        },
      },
    });

    return result.reduce((acc, val) => {
      acc.set(val.id, Ministere.creerMinistere({
        code: val.id,
        icone: val.icone || '',
      }));

      return acc;
    }, new Map<string, Ministere>());
  }
}
