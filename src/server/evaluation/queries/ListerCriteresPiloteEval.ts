import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/evaluation/module";

export type CriterePiloteEval = {
  id: string;
  libelle: string;
};

export class ListerCriteresPiloteEval {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<CriterePiloteEval[]> {
    return this.prisma.getInstance().referentiel_critere.findMany({
      select: {
        id: true,
        libelle: true,
      },
    });
  }
}
