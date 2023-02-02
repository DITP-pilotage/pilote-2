import { PrismaClient } from '@prisma/client';

import PérimètreMinistériel from '@/server/domain/ministère/PérimètreMinistériel.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import { Ministère } from '@/components/PageChantiers/BarreLatérale/FiltresMinistères/FiltresMinistères.interface';

type IdEtNomParMinistere = { ministere: string, ids: string[], noms: string[] };

export default class MinistèreSQLRepository implements MinistèreRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Ministère[]> {
    const périmètreIdEtNomParMinistère: IdEtNomParMinistere[] = await this.prisma.$queryRaw`
     select ministere, array_agg(id order by nom) as ids, array_agg(nom order by nom) as noms from perimetre group by ministere order by ministere;
    `;
    return this.parseMinistères(périmètreIdEtNomParMinistère);
  }

  private parseMinistères(périmètreIdEtNomParMinistère: IdEtNomParMinistere[]): Ministère[] {
    const result = [];
    for (const idEtNomParMinistère of périmètreIdEtNomParMinistère) {
      const périmètres: PérimètreMinistériel[] = [];
      for (let i = 0; i < idEtNomParMinistère.ids.length; ++i) {
        périmètres.push({ id: idEtNomParMinistère.ids[i], nom: idEtNomParMinistère.noms[i] });
      }
      result.push({ nom: idEtNomParMinistère.ministere, périmètresMinistériels: périmètres });
    }
    return result;
  }
}
