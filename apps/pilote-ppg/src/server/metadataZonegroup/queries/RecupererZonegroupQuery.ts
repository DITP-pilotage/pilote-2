import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export interface MetadataZonegroup {
  zoneGroupId: string;
  zgName: string;
  zgDesc: string | null;
  zgZones: string[];
  deletedAt: string | null;
}

export class RecupererZonegroupQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    zoneGroupId,
  }: {
    zoneGroupId: string;
  }): Promise<MetadataZonegroup> {
    const zonegroup = await this.prisma
      .getInstance()
      .metadata_zonegroup.findUniqueOrThrow({
        where: { zone_group_id: zoneGroupId },
      });
    return {
      zoneGroupId: zonegroup.zone_group_id,
      zgName: zonegroup.zg_name,
      zgDesc: zonegroup.zg_desc,
      zgZones: zonegroup.zg_zones,
      deletedAt: zonegroup.deleted_at?.toISOString() ?? null,
    };
  }
}
