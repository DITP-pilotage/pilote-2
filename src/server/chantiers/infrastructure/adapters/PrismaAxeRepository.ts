import { Prisma, PrismaClient } from '@prisma/client';
import { AxeRepository } from '@/server/chantiers/domain/ports/AxeRepository';
import { Axe } from '@/server/chantiers/domain/Axe';
import { PrismaPilote } from '@/server/db/PrismaPilote';

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaAxeRepository implements AxeRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async getListe(): Promise<Axe[]> {
    return this.prisma.axe.findMany();
  }

  async getListePourChantiers(chantierIds: string[]): Promise<Axe[]> {
    return this.prisma.$queryRaw<Axe[]>`
    WITH axe_liste AS (
      select DISTINCT c.axe as axe_id from chantier_identite c where  c.id IN (${Prisma.join(chantierIds)})
    )
    select a.*
    from axe a
    JOIN axe_liste al ON al.axe_id = a.nom
    `;
  }
}

