import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import {
  OptionsChantierContrat,
  presenterEnOptionsChantierContrat,
} from "@/server/app/contrats/MetadataChantierContrat";

export class RecupererOptionsChantierQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<OptionsChantierContrat> {
    const prismaClient = this.prisma.getInstance();
    const [ppgs, porteursMIN, porteursDac, perimetres, zonegroups] =
      await Promise.all([
        prismaClient.metadata_ppgs.findMany({ orderBy: { ppg_id: "asc" } }),
        prismaClient.metadata_porteurs.findMany({
          where: { porteur_type_short: "MIN" },
          orderBy: { porteur_id: "asc" },
        }),
        prismaClient.metadata_porteurs.findMany({
          where: { porteur_type_short: "DAC" },
          orderBy: { porteur_id: "asc" },
        }),
        prismaClient.metadata_perimetres.findMany({
          orderBy: { perimetre_id: "asc" },
        }),
        prismaClient.metadata_zonegroup.findMany({
          orderBy: { zone_group_id: "asc" },
        }),
      ]);
    return presenterEnOptionsChantierContrat({
      ppgs,
      porteursMIN,
      porteursDac,
      perimetres,
      zonegroups,
    });
  }
}
