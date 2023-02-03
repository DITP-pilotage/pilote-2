import { PrismaClient } from '@prisma/client';

import PérimètreMinistériel from '@/server/domain/ministère/PérimètreMinistériel.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

type MinistèreQueryResult = { ministere: string, ids: string[], noms: string[] };

export default class MinistèreSQLRepository implements MinistèreRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Ministère[]> {
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
        select ministere,
               array_agg(id order by nom) as ids,
               array_agg(nom order by nom) as noms
        from perimetre
        group by ministere
        order by ministere;
    `;
    return queryResults.map(queryResult => this.parseMinistère(queryResult));
  }

  private parseMinistère(ministèreQueryResult: MinistèreQueryResult): Ministère {
    const périmètres: PérimètreMinistériel[] = [];
    for (let i = 0; i < ministèreQueryResult.ids.length; ++i) {
      périmètres.push({ id: ministèreQueryResult.ids[i], nom: ministèreQueryResult.noms[i] });
    }

    return {
      nom: ministèreQueryResult.ministere,
      périmètresMinistériels: périmètres,
    };
  }
}
