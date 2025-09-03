import { territoire as TerritoirePrisma } from "@prisma/client";
import { NOMS_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertirEnTerritoire = (territoire: TerritoirePrisma): Territoire => {
  return {
    code: territoire.code,
    nom: territoire.nom,
    nomAffiché: territoire.nom_affiche,
    codeInsee: territoire.code_insee,
    codeParent: territoire.code_parent,
    maille: NOMS_MAILLES[territoire.maille],
  };
};

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaTerritoireRepository implements TerritoireRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async lister(codes: string[]) {
    const territoires = await this.prisma.territoire.findMany({
      where: { code: codes.length > 0 ? { in: codes } : undefined },
    });

    return territoires.map(convertirEnTerritoire);
  }

  async listerCodes(codes: string[]) {
    const territoires = await this.prisma.territoire.findMany({
      where: { code: codes.length > 0 ? { in: codes } : undefined },
      select: {
        code: true,
      },
    });

    return territoires.map((territoire) => territoire.code);
  }
}
