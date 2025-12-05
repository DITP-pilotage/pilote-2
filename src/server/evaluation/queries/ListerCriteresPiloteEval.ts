import { PrismaPilote } from "@/server/db/PrismaPilote";

export type CriterePiloteEval = {
  id: string;
  libelle: string;
};

export class ListerCriteresPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<CriterePiloteEval[]> {
    return this.dependencies.prisma.getInstance().referentiel_critere.findMany({
      select: {
        id: true,
        libelle: true,
      },
    });
  }
}
