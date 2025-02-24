import { MinistereRepository } from '@/server/fiche-territoriale/domain/ports/MinistereRepository';
import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';
import { prisma } from '@/server/db/prisma';

export class PrismaMinistereRepository implements MinistereRepository {
  async recupererMapMinistereParListeCodeMinistere({ listeCodeMinistere }: {
    listeCodeMinistere: string[]
  }): Promise<Map<string, Ministere>> {
    const result = await prisma.ministere.findMany({
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
