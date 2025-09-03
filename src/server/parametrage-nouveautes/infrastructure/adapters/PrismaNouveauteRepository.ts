import { nouveaute as NouveauteModel } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";

import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertirNouveauteEnNouveauteModel = (
  nouveaute: Nouveaute,
): NouveauteModel => {
  return {
    id: nouveaute.id,
    contenu: nouveaute.contenu,
    date_creation: nouveaute.dateCreation,
    version: nouveaute.version,
    date: nouveaute.date,
  };
};

const convertirNouveauteEnNouveaute = (
  nouveauteModel: NouveauteModel,
): Nouveaute => {
  return Nouveaute.creerNouveaute({
    id: nouveauteModel.id,
    contenu: nouveauteModel.contenu,
    dateCreation: nouveauteModel.date_creation,
    version: nouveauteModel.version,
    date: nouveauteModel.date,
  });
};

export class PrismaNouveauteRepository implements NouveauteRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async creerNouveaute(nouveaute: Nouveaute): Promise<void> {
    const nouveauteModel = convertirNouveauteEnNouveauteModel(nouveaute);
    await this.prisma.nouveaute.create({ data: nouveauteModel });
  }

  async listerNouveautes(): Promise<Nouveaute[]> {
    const nouveautes = await this.prisma.nouveaute.findMany();
    return nouveautes
      .sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.version.split(".");
        const [bMajor, bMinor, bPatch] = b.version.split(".");
        if (+aMajor !== +bMajor) {
          return +bMajor - +aMajor;
        }
        if (+aMinor !== +bMinor) {
          return +bMinor - +aMinor;
        }
        return +bPatch - +aPatch;
      })
      .map(convertirNouveauteEnNouveaute);
  }

  async modifier(nouveaute: Nouveaute): Promise<void> {
    const nouveauteModel = convertirNouveauteEnNouveauteModel(nouveaute);

    await this.prisma.nouveaute.update({
      where: { id: nouveaute.id },
      data: nouveauteModel,
    });
  }
}
