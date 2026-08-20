import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export class RestorerZonegroupHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ zoneGroupId }: { zoneGroupId: string }): Promise<void> {
    await this.prisma.getInstance().metadata_zonegroup.update({
      where: { zone_group_id: zoneGroupId },
      data: { deleted_at: null },
    });
  }
}
