import { PrismaClient } from '@prisma/client';
import PpgRepository from '@/server/domain/ppg/PpgRepository.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';

export default class PpgSQLRepository implements PpgRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Ppg[]> {
    return this.prisma.ppg.findMany();
  }
}

