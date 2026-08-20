import type { metadata_zonegroup } from "@prisma/client";
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
  zonegroup: Pick<
    metadata_zonegroup,
    "zone_group_id" | "zg_name" | "zg_zones" | "updated_at" | "deleted_at"
  >,
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

  async run(): Promise<ZonegroupAdminListItem[]> {
    const zonegroups = await this.prisma
      .getInstance()
      .metadata_zonegroup.findMany({
        select: {
          zone_group_id: true,
          zg_name: true,
          zg_zones: true,
          updated_at: true,
          deleted_at: true,
        },
        orderBy: [{ updated_at: "desc" }],
      });
    return zonegroups.map(toApiModel);
  }
}
