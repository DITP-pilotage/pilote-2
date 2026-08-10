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
      .metadata_zonegroup.findMany({ orderBy: { zone_group_id: "asc" } });
    return zonegroups.map((z) => ({
      id: z.zone_group_id,
      nom: z.zg_name,
    }));
  }
}
