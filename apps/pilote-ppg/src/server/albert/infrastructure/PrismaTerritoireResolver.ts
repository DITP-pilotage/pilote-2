import type { Maille } from "@prisma/client";
import type { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const TERRITOIRE_NATIONAL = "NAT-FR";

export class PrismaTerritoireResolver implements TerritoireResolver {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async resoudre(perimetre: Perimetre): Promise<string[]> {
    switch (perimetre.type) {
      case "SELECTION":
        return [...new Set(perimetre.territoire_codes)];
      case "REGION_ET_SES_DEPARTEMENTS":
        return [
          perimetre.region_code,
          ...(await this.codesDeMaille({
            maille: "DEPT",
            codeParent: perimetre.region_code,
          })),
        ];
      // Les territoires REG-xxx n'ont pas NAT-FR comme parent en base ;
      // on remonte donc toutes les régions par leur maille.
      case "FRANCE_ET_SES_REGIONS":
        return [
          TERRITOIRE_NATIONAL,
          ...(await this.codesDeMaille({ maille: "REG" })),
        ];
      case "TOUTES_REGIONS":
        return this.codesDeMaille({ maille: "REG" });
      case "TOUS_DEPARTEMENTS":
        return this.codesDeMaille({ maille: "DEPT" });
    }
  }

  private async codesDeMaille({
    maille,
    codeParent,
  }: {
    maille: Maille;
    codeParent?: string;
  }): Promise<string[]> {
    const territoires = await this.prisma.getInstance().territoire.findMany({
      where: {
        maille,
        ...(codeParent && { code_parent: codeParent }),
      },
      orderBy: { code: "asc" },
    });
    return territoires.map((territoire) => territoire.code);
  }
}
