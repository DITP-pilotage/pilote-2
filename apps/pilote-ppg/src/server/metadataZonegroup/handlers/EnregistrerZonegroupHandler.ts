import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";

export const zonegroupCommandSchema = z.object({
  zoneGroupId: z.string().min(1),
  zgName: z.string().min(1).max(200),
  zgDesc: z.string().nullable(),
  zgZones: z.array(z.string()).min(1),
});

export type ZonegroupCommand = z.infer<typeof zonegroupCommandSchema>;

export class EnregistrerZonegroupHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: ZonegroupCommand): Promise<void> {
    const data = {
      zg_name: command.zgName,
      zg_desc: command.zgDesc,
      zg_zones: command.zgZones,
    };
    await this.prisma.getInstance().metadata_zonegroup.upsert({
      where: { zone_group_id: command.zoneGroupId },
      create: { zone_group_id: command.zoneGroupId, ...data },
      update: data,
    });
  }
}
