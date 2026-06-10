import type { Maille } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type TerritoireIdentiteResult = {
  code: string;
  nom: string;
  maille: Maille;
  code_parent: string | null;
};

export class GetTerritoiresIdentiteQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(): Promise<TerritoireIdentiteResult[]> {
    const prisma = this.deps.prisma.getInstance();

    const territoires = await prisma.territoire.findMany({
      orderBy: { code: "asc" },
    });

    return territoires.map((territoire) => ({
      code: territoire.code,
      nom: territoire.nom,
      maille: territoire.maille,
      code_parent: territoire.code_parent,
    }));
  }
}
