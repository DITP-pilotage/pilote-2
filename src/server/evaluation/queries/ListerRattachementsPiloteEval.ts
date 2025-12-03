import { PrismaPilote } from "@/server/db/PrismaPilote";

export type RattachementPiloteEval = {
  code: string;
  libelle: string;
  groupe: string;
  ordre: number;
};

export class ListerRattachementsPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<RattachementPiloteEval[]> {
    return this.dependencies.prisma
      .getInstance()
      .referentiel_rattachement.findMany({
        select: {
          code: true,
          libelle: true,
          groupe: true,
          ordre: true,
        },
      });
  }
}
