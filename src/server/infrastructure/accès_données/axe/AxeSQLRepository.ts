import { Prisma, PrismaClient } from '@prisma/client';
import AxeRepository from '@/server/domain/axe/AxeRepository.interface';
import Axe from '@/server/domain/axe/Axe.interface';


export default class AxeSQLRepository implements AxeRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Axe[]> {
    return this.prisma.axe.findMany();
  }

  async getListePourChantiers(chantierIds: string[]): Promise<Axe[]> {
    return this.prisma.$queryRaw<Axe[]>`
    WITH axe_liste AS (
      select DISTINCT c.axe as axe_id from chantier c where  c.id IN (${Prisma.join(chantierIds)})
    )
    select a.*
    from axe a
    JOIN axe_liste al ON al.axe_id = a.nom
    `;
  }
}

