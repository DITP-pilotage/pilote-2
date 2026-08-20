import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export interface ZoneDisponible {
  zoneId: string;
  nom: string;
  zoneType: string;
}

type ZoneRow = {
  zone_id: string;
  nom: string;
  zone_type: string;
};

function toApiModel(zone: ZoneRow): ZoneDisponible {
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
      select: { zone_id: true, nom: true, zone_type: true },
      orderBy: [{ updated_at: "desc" }],
    });
    return zones.map(toApiModel);
  }
}
