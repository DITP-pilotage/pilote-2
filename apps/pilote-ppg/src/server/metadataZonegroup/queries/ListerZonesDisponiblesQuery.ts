import type { metadata_zones as MetadataZonesPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export interface ZoneDisponible {
  zoneId: string;
  nom: string;
  zoneType: string;
}

function toApiModel(zone: MetadataZonesPrisma): ZoneDisponible {
  return {
    zoneId: zone.zone_id,
    nom: zone.nom,
    zoneType: zone.zone_type,
  };
}

export class ListerZonesDisponiblesQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<ZoneDisponible[]> {
    const zones = await this.prisma.getInstance().metadata_zones.findMany({
      where: { zone_type: { in: ["DEPT", "REG", "NAT"] } },
      orderBy: [{ updated_at: "desc" }],
    });
    return zones.map(toApiModel);
  }
}
