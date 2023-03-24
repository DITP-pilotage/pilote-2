import { PrismaClient, Prisma } from '@prisma/client';
import PpgRepository from '@/server/domain/ppg/PpgRepository.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default class PpgSQLRepository implements PpgRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Ppg[]> {
    return this.prisma.ppg.findMany();
  }

  async getListePourChantiers(chantiers: Chantier[]): Promise<Ppg[]> {
    let list_chantier = chantiers.map(x => x.id)
    const queryResults: Ppg[] = await this.prisma.$queryRaw`
    WITH ppg_liste AS (
      select DISTINCT c.ppg as ppg_id from chantier c where  c.id IN (${Prisma.join(list_chantier)})
    )
    select p.*
    from ppg p
    JOIN ppg_liste pl ON pl.ppg_id = p.nom
    `;
    return queryResults;
  }
}

