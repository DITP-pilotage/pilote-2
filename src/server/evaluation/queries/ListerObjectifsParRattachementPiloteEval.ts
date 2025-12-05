import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ObjectifPiloteEval = {
  id: string;
  libelle: string;
};

export type ObjectifsParRattachement = Record<string, ObjectifPiloteEval[]>;

export class ListerObjectifsParRattachementPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({ jalon }: { jalon: number }): Promise<ObjectifsParRattachement> {
    const objectifs = await this.dependencies.prisma
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
