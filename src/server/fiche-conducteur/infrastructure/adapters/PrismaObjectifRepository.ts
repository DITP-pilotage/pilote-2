import { objectif as ObjectifModel } from "@prisma/client";
import { Objectif } from "@/server/fiche-conducteur/domain/Objectif";
import { ObjectifRepository } from "@/server/fiche-conducteur/domain/ports/ObjectifRepository";

import { PrismaPilote } from "@/server/db/PrismaPilote";

import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertifEnObjectif = (objectifModel: ObjectifModel): Objectif =>
  Objectif.creerObjectif({
    type: objectifModel.type,
    contenu: objectifModel.contenu,
    date: objectifModel.date.toISOString(),
  });

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaObjectifRepository implements ObjectifRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async listerObjectifParChantierId({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<Objectif[]> {
    const objectifResult = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return objectifResult.map(convertifEnObjectif);
  }
}
