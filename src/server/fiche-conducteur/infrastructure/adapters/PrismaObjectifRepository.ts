import { objectif as ObjectifModel } from '@prisma/client';
import { Objectif } from '@/server/fiche-conducteur/domain/Objectif';
import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';
import { prisma } from '@/server/db/prisma';

const convertifEnObjectif = (objectifModel: ObjectifModel): Objectif => (Objectif.creerObjectif({
  type: objectifModel.type,
  contenu: objectifModel.contenu,
  date: objectifModel.date.toISOString(),
})
);

export class PrismaObjectifRepository implements ObjectifRepository {
  async listerObjectifParChantierId({ chantierId }: { chantierId: string }): Promise<Objectif[]> {
    const objectifResult = await prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return objectifResult.map(convertifEnObjectif);
  }
}
