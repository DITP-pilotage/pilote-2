import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/metadata-axe/module";

export interface UtilisationAxe {
  estUtilise: boolean;
  nombrePpgs: number;
}

export class VerifierUtilisationAxeQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ axeId }: { axeId: string }): Promise<UtilisationAxe> {
    const nombrePpgs = await this.prisma
      .getInstance()
      .metadata_ppgs.count({ where: { ppg_axe: axeId } });

    return {
      estUtilise: nombrePpgs > 0,
      nombrePpgs,
    };
  }
}
