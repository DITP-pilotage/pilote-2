import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPpg/module";

export interface UtilisationPpg {
  estUtilise: boolean;
  nombreChantiers: number;
}

export class VerifierUtilisationPpgQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ ppgId }: { ppgId: string }): Promise<UtilisationPpg> {
    const nombreChantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.count({ where: { ch_ppg: ppgId } });

    return {
      estUtilise: nombreChantiers > 0,
      nombreChantiers,
    };
  }
}
