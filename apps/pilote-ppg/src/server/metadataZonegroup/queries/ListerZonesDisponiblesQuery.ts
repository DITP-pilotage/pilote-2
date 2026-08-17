import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export interface ZoneDisponible {
  zoneId: string;
  nom: string;
  zoneType: string;
}

export class ListerZonesDisponiblesQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<ZoneDisponible[]> {
    const zones = await this.prisma
      .getInstance()
      .metadata_zones.findMany({
        where: { zone_type: { in: ["DEPT", "REG", "NAT"] } },
        select: { zone_id: true, nom: true, zone_type: true },
        orderBy: [{ zone_type: "asc" }, { zone_id: "asc" }],
      });
    return zones.map((z) => ({
      zoneId: z.zone_id,
      nom: z.nom,
      zoneType: z.zone_type,
    }));
  }
}
