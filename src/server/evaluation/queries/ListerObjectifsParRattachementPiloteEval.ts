import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/evaluation/module";

export type ObjectifPiloteEval = {
  id: string;
  libelle: string;
};

export type ObjectifsParRattachement = Record<string, ObjectifPiloteEval[]>;

export class ListerObjectifsParRattachementPiloteEval {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ jalon }: { jalon: number }): Promise<ObjectifsParRattachement> {
    const objectifs = await this.prisma
      .getInstance()
      .referentiel_objectif.findMany({
        where: {
          jalon,
        },
        select: {
          id: true,
          libelle: true,
          rattachement_code: true,
        },
      });

    const objectifsParRattachement: ObjectifsParRattachement = {};

    for (const objectif of objectifs) {
      const rattachementCode = objectif.rattachement_code;

      if (!objectifsParRattachement[rattachementCode]) {
        objectifsParRattachement[rattachementCode] = [];
      }

      objectifsParRattachement[rattachementCode].push({
        id: objectif.id,
        libelle: objectif.libelle,
      });
    }

    return objectifsParRattachement;
  }
}
