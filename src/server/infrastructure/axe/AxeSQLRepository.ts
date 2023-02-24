import { PrismaClient } from '@prisma/client';
import AxeRepository from '@/server/domain/axe/AxeRepository.interface';
import Axe from '@/server/domain/axe/Axe.interface';

export default class AxeSQLRepository implements AxeRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Axe[]> {
    return this.prisma.axe.findMany({
      where: {
        NOT: { nom: null },
      },
    });
  }
}

