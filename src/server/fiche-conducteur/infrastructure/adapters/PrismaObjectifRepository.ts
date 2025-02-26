import { objectif as ObjectifModel, PrismaClient } from '@prisma/client';
import { Objectif } from '@/server/fiche-conducteur/domain/Objectif';
import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';

import { PrismaPilote } from '@/server/db/PrismaPilote';

const convertifEnObjectif = (objectifModel: ObjectifModel): Objectif => (Objectif.creerObjectif({
  type: objectifModel.type,
  contenu: objectifModel.contenu,
  date: objectifModel.date.toISOString(),
})
);

interface Dependencies {
  prisma: PrismaPilote
}

export class PrismaObjectifRepository implements ObjectifRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async listerObjectifParChantierId({ chantierId }: { chantierId: string }): Promise<Objectif[]> {
    const objectifResult = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return objectifResult.map(convertifEnObjectif);
  }
}
