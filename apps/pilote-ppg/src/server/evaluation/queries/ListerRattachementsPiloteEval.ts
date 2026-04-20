import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/evaluation/module";

export type RattachementPiloteEval = {
  code: string;
  libelle: string;
  groupe: string;
  ordre: number;
};

export class ListerRattachementsPiloteEval {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<RattachementPiloteEval[]> {
    return this.prisma.getInstance().referentiel_rattachement.findMany({
      select: {
        code: true,
        libelle: true,
        groupe: true,
        ordre: true,
      },
    });
  }
}
