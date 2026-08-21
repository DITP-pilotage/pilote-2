import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export class RecupererIdSuivantZonegroupQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<string> {
    const dernier = await this.prisma
      .getInstance()
      .metadata_zonegroup.findFirst({
        where: { zone_group_id: { not: "ZG-REF" } },
        orderBy: { zone_group_id: "desc" },
      });
    const dernierNumero = dernier
      ? parseInt(dernier.zone_group_id.replace("ZG-", ""), 10)
      : 0;
    return `ZG-${String(dernierNumero + 1).padStart(3, "0")}`;
  }
}
