import { PrismaClient } from '@prisma/client';
import { TerritoireRepository } from '@/server/chantiers/domain/ports/TerritoireRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

export class PrismaTerritoireRepository implements TerritoireRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode }: { territoireCode: string }): Promise<string[]> {
    const territoire = await this.prisma.territoire.findUnique({
      where: {
        code: territoireCode,
      },
      include: {
        territoire_enfant: true,
      },
    });

    if (!territoire) {
      throw new Error('Territoire non trouvé');
    }

    return [territoire.code, ...territoire.territoire_enfant.map(territoireEnfant => territoireEnfant.code)];
  }
}