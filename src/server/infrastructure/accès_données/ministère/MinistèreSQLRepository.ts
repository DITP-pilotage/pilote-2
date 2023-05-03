import { PrismaClient, Prisma } from '@prisma/client';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

type MinistèreQueryResult = { ministere: string, ids: string[], noms: string[], ministere_id: string };

export default class MinistèreSQLRepository implements MinistèreRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Ministère[]> {
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
        select ministere,
               ministere_id,
               array_agg(id order by nom) as ids,
               array_agg(nom order by nom) as noms
        from perimetre
        group by ministere, ministere_id
        order by ministere, ministere_id;
    `;
    return queryResults.map(queryResult => this.parseMinistère(queryResult));
  }


  private parseMinistère(ministèreQueryResult: MinistèreQueryResult): Ministère {
    const périmètres: PérimètreMinistériel[] = [];
    for (let i = 0; i < ministèreQueryResult.ids.length; ++i) {
      périmètres.push({ id: ministèreQueryResult.ids[i], nom: ministèreQueryResult.noms[i], ministere_id: ministèreQueryResult.ministere_id ?? null });
    }

    return {
      nom: ministèreQueryResult.ministere,
      périmètresMinistériels: périmètres,
    };
  }

  async getListePourChantiers(chantiers: Chantier[]): Promise<Ministère[]> {
    let list_chantier = chantiers.map(x => x.id);
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
    WITH ministere_liste AS (
      select DISTINCT unnest(c.perimetre_ids) as perimetre_id from chantier c where  c.id IN (${Prisma.join(list_chantier)})
    )
    select ministere,
           ministere_id,
           array_agg(id order by nom) as ids,
           array_agg(nom order by nom) as noms
    from perimetre p
    JOIN ministere_liste pl ON pl.perimetre_id = p.id
    group by ministere, ministere_id
    order by ministere, ministere_id;
    `;
    return queryResults.map(queryResult => this.parseMinistère(queryResult));
  }
}
