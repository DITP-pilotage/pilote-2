import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export const zonegroupCommandSchema = z.object({
  zoneGroupId: z.string().min(1),
  zoneGroupName: z.string().min(1).max(200),
  zoneGroupDesc: z.string().nullable(),
  zoneGroupZones: z.array(z.string()).min(1),
});

export type ZonegroupCommand = z.infer<typeof zonegroupCommandSchema>;

export class EnregistrerZonegroupHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: ZonegroupCommand): Promise<void> {
    await this.prisma.getInstance().metadata_zonegroup.upsert({
      where: { zone_group_id: command.zoneGroupId },
      create: {
        zone_group_id: command.zoneGroupId,
        zg_name: command.zoneGroupName,
        zg_desc: command.zoneGroupDesc,
        zg_zones: command.zoneGroupZones,
      },
      update: {
        zg_name: command.zoneGroupName,
        zg_desc: command.zoneGroupDesc,
        zg_zones: command.zoneGroupZones,
      },
    });
  }
}
