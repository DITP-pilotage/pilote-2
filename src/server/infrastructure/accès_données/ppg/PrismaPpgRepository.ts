import { Prisma, PrismaClient } from '@prisma/client';
import { PpgRepository } from '@/server/domain/ppg/PpgRepository.interface';
import { Ppg } from '@/server/domain/ppg/Ppg.interface';
import { PrismaPilote } from '@/server/db/PrismaPilote';

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaPpgRepository implements PpgRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async getListe(): Promise<Ppg[]> {
    return this.prisma.ppg.findMany();
  }

  async getListePourChantiers(chantierIds: string[]): Promise<Ppg[]> {
    return this.prisma.$queryRaw`
      WITH ppg_liste AS (select DISTINCT c.ppg as ppg_id
                         from chantier_identite c
                         where c.id IN (${Prisma.join(chantierIds)}))
      select p.*
      from ppg p
             JOIN ppg_liste pl ON pl.ppg_id = p.nom
    `;
  }
}

