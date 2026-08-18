import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export interface PorteurAdminListItem {
  porteurId: string;
  porteurShort: string;
  porteurName: string;
  porteurTypeShort: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ListerPorteursAdminQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<PorteurAdminListItem[]> {
    const porteurs = await this.prisma
      .getInstance()
      .metadata_porteurs.findMany({
        select: {
          porteur_id: true,
          porteur_short: true,
          porteur_name: true,
          porteur_type_short: true,
          updated_at: true,
          deleted_at: true,
        },
        orderBy: [{ updated_at: "desc" }],
      });
    return porteurs.map((p) => ({
      porteurId: p.porteur_id,
      porteurShort: p.porteur_short,
      porteurName: p.porteur_name,
      porteurTypeShort: p.porteur_type_short,
      updatedAt: p.updated_at,
      deletedAt: p.deleted_at,
    }));
  }
}
