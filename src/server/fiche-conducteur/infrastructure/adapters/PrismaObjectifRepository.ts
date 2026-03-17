import { $Enums, objectif as ObjectifModel } from "@prisma/client";
import { Objectif } from "@/server/fiche-conducteur/domain/Objectif";
import { ObjectifRepository } from "@/server/fiche-conducteur/domain/ports/ObjectifRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

const convertifEnObjectif = (objectifModel: ObjectifModel): Objectif =>
  Objectif.creerObjectif({
    type: objectifModel.type,
    contenu: objectifModel.contenu,
    date: objectifModel.date_modification.toISOString(),
  });

export class PrismaObjectifRepository implements ObjectifRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async listerObjectifParChantierId({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<Objectif[]> {
    const objectifResult = await this.prisma.objectif.findMany({
      where: {
        statut: $Enums.statut_publication.PUBLIE,
        chantier_id: chantierId,
      },
    });

    return objectifResult.map(convertifEnObjectif);
  }
}
