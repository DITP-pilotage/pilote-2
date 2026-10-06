import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export interface UtilisationEngagement {
  estUtilise: boolean;
  nombreChantiers: number;
}

export class VerifierUtilisationEngagementQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    engagementShort,
  }: {
    engagementShort: string;
  }): Promise<UtilisationEngagement> {
    const nombreChantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.count({
        where: { engagement_short: engagementShort },
      });

    return {
      estUtilise: nombreChantiers > 0,
      nombreChantiers,
    };
  }
}
