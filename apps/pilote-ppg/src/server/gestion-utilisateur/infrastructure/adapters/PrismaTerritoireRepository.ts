import { territoire as TerritoirePrisma } from "@prisma/client";
import { NOMS_MAILLES } from "@/shared/maille/mailleSQLParser";
import { Territoire } from "@/shared/territoire/Territoire.interface";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import type { Inject } from "@/server/gestion-utilisateur/module";

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

export class PrismaTerritoireRepository implements TerritoireRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma.getInstance();
  }

  async list(codes: string[]) {
    if (codes.length === 0) return [];
    const territoires = await this.prisma.territoire.findMany({
      where: { code: { in: codes } },
    });

    return territoires.map(convertirEnTerritoire);
  }

  async listAll() {
    const territoires = await this.prisma.territoire.findMany();

    return territoires.map(convertirEnTerritoire);
  }

  async listAllCodes() {
    const territoires = await this.prisma.territoire.findMany({
      select: { code: true },
    });

    return territoires.map((territoire) => territoire.code);
  }
}
