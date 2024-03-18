import { PrismaClient, objectif as ObjectifModel } from '@prisma/client';
import { Objectif } from '@/server/fiche-conducteur/domain/Objectif';
import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';

const convertifEnObjectif = (objectifModel: ObjectifModel): Objectif => (Objectif.creerObjectif({
  type: objectifModel.type,
  contenu: objectifModel.contenu,
  date: objectifModel.date.toISOString(),
})
);

export class PrismaObjectifRepository implements ObjectifRepository {

  constructor(private prismaClient: PrismaClient) {}

  async listerObjectifParChantierId({ chantierId }: { chantierId: string }): Promise<Objectif[]> {
    const objectifResult = await this.prismaClient.objectif.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return objectifResult.map(convertifEnObjectif);
  }
}
