import type { PrismaPilote } from "@/server/db/PrismaPilote";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

export class PrismaTerritoireResolver implements TerritoireResolver {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async resoudre(
    territoireCode: string,
    includeSousTerritoires: boolean,
  ): Promise<string[]> {
    if (!includeSousTerritoires) return [territoireCode];

    const territoire = await this.prisma
      .getInstance()
      .territoire.findUniqueOrThrow({
        where: { code: territoireCode },
        include: { territoire_enfant: true },
      });

    return [
      territoire.code,
      ...territoire.territoire_enfant.map((enfant) => enfant.code),
    ];
  }
}
