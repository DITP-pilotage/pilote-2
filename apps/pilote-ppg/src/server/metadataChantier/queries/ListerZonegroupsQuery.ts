import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface Zonegroup {
  id: string;
  nom: string;
}

export class ListerZonegroupsQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<Zonegroup[]> {
    const zonegroups = await this.prisma
      .getInstance()
      .metadata_zonegroup.findMany({
        where: { deleted_at: null },
        orderBy: { zone_group_id: "asc" },
      });
    return zonegroups.map(toApiModel);
  }
}

function toApiModel(z: { zone_group_id: string; zg_name: string }): Zonegroup {
  return { id: z.zone_group_id, nom: z.zg_name };
}
