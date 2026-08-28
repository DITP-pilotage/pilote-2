import type { metadata_zonegroup as MetadataZonegroupPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export interface ZonegroupAdminListItem {
  zoneGroupId: string;
  zgName: string;
  nbZones: number;
  updatedAt: string;
  deletedAt: string | null;
}

function toApiModel(
  zonegroup: MetadataZonegroupPrisma,
): ZonegroupAdminListItem {
  return {
    zoneGroupId: zonegroup.zone_group_id,
    zgName: zonegroup.zg_name,
    nbZones: zonegroup.zg_zones.length,
    updatedAt: zonegroup.updated_at.toISOString(),
    deletedAt: zonegroup.deleted_at?.toISOString() ?? null,
  };
}

export class ListerZonegroupsAdminQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(
    options: { actifsSeulement?: boolean } = {},
  ): Promise<ZonegroupAdminListItem[]> {
    const zonegroups = await this.prisma
      .getInstance()
      .metadata_zonegroup.findMany({
        where: options.actifsSeulement ? { deleted_at: null } : undefined,
        orderBy: [{ updated_at: "desc" }],
      });
    return zonegroups.map(toApiModel);
  }
}
