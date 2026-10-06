import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export interface UtilisationZonegroup {
  estUtilise: boolean;
  nombreChantiers: number;
  nombreIndicateurs: number;
}

export class CheckZonegroupUsageQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    zoneGroupId,
  }: {
    zoneGroupId: string;
  }): Promise<UtilisationZonegroup> {
    const instance = this.prisma.getInstance();

    const [nombreChantiers, nombreIndicateurs] = await Promise.all([
      instance.metadata_chantiers.count({
        where: { zg_applicable: zoneGroupId },
      }),
      instance.metadata_indicateurs_hidden.count({
        where: { zg_applicable: zoneGroupId },
      }),
    ]);

    return {
      estUtilise: nombreChantiers > 0 || nombreIndicateurs > 0,
      nombreChantiers,
      nombreIndicateurs,
    };
  }
}
