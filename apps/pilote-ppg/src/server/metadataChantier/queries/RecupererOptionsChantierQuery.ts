import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface OptionsChantier {
  ppgs: { id: string; nom: string }[];
  porteursMIN: { id: string; label: string }[];
  porteursDac: { id: string; label: string }[];
  perimetres: { id: string; nom: string }[];
  zonegroups: { id: string; nom: string }[];
}

export class RecupererOptionsChantierQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<OptionsChantier> {
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
    return {
      ppgs: ppgs.map((p) => ({ id: p.ppg_id, nom: p.ppg_nom })),
      porteursMIN: porteursMIN.map((p) => ({
        id: p.porteur_id,
        label: p.porteur_name_short ?? p.porteur_short,
      })),
      porteursDac: porteursDac.map((p) => ({
        id: p.porteur_id,
        label: p.porteur_name_short ?? p.porteur_short,
      })),
      perimetres: perimetres.map((p) => ({
        id: p.perimetre_id,
        nom: p.per_nom,
      })),
      zonegroups: zonegroups.map((z) => ({
        id: z.zone_group_id,
        nom: z.zg_name ?? z.zone_group_id,
      })),
    };
  }
}
