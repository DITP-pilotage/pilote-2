import { territoire as TerritoirePrisma } from "@prisma/client";
import { TerritoireRepository } from "@/server/chantiers/domain/ports/TerritoireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { NOMS_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

export class PrismaTerritoireRepository implements TerritoireRepository {
  private readonly prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  _mapperVersLeDomaine(territoire: TerritoirePrisma): Territoire {
    return {
      code: territoire.code,
      nom: territoire.nom,
      nomAffiché: territoire.nom_affiche,
      codeInsee: territoire.code_insee,
      codeParent: territoire.code_parent,
      maille: NOMS_MAILLES[territoire.maille],
    };
  }

  async recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({
    territoireCode,
  }: {
    territoireCode: string;
  }): Promise<string[]> {
    const territoire = await this.prisma.territoire.findUnique({
      where: {
        code: territoireCode,
      },
      include: {
        territoire_enfant: true,
      },
    });

    if (!territoire) {
      throw new Error("Territoire non trouvé");
    }

    return [
      territoire.code,
      ...territoire.territoire_enfant.map(
        (territoireEnfant) => territoireEnfant.code,
      ),
    ];
  }

  async récupérerTousNew() {
    const territoires = await this.prisma.territoire.findMany();
    return territoires.map((t) => this._mapperVersLeDomaine(t));
  }
}
