import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export interface UtilisationPerimetre {
  estUtilise: boolean;
  nombreChantiers: number;
}

export class VerifierUtilisationPerimetreQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    perimetreId,
  }: {
    perimetreId: string;
  }): Promise<UtilisationPerimetre> {
    const nombreChantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.count({
        where: { ch_per: perimetreId },
      });

    return { estUtilise: nombreChantiers > 0, nombreChantiers };
  }
}
