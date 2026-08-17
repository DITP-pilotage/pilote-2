import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export interface ZonegroupAdminListItem {
  zoneGroupId: string;
  zgName: string;
  nbZones: number;
  updatedAt: Date;
  deletedAt: Date | null;
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
        orderBy: [{ deleted_at: "asc" }, { zone_group_id: "asc" }],
      });
    return zonegroups.map((z) => ({
      zoneGroupId: z.zone_group_id,
      zgName: z.zg_name,
      nbZones: z.zg_zones.length,
      updatedAt: z.updated_at,
      deletedAt: z.deleted_at,
    }));
  }
}
