import { PrismaPilote } from "@/server/db/PrismaPilote";

export type TerritoireDTO = {
  code: string;
  nom: string;
};

export class RecupererTerritoiresQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(
    territoireCodes: string[],
  ): Promise<Record<string, TerritoireDTO>> {
    if (territoireCodes.length === 0) {
      return {};
    }

    const prisma = this.deps.prisma.getInstance();

    const rows = await prisma.territoire.findMany({
      where: { code: { in: territoireCodes } },
      select: { code: true, nom: true },
    });

    const result: Record<string, TerritoireDTO> = {};
    for (const row of rows) {
      result[row.code] = { code: row.code, nom: row.nom };
    }

    return result;
  }
}
