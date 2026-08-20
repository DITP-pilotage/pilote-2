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

type PorteurRow = {
  porteur_id: string;
  porteur_short: string;
  porteur_name: string;
  porteur_type_short: string | null;
  updated_at: Date;
  deleted_at: Date | null;
};

function toApiModel(porteur: PorteurRow): PorteurAdminListItem {
  return {
    porteurId: porteur.porteur_id,
    porteurShort: porteur.porteur_short,
    porteurName: porteur.porteur_name,
    porteurTypeShort: porteur.porteur_type_short,
    updatedAt: porteur.updated_at,
    deletedAt: porteur.deleted_at,
  };
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
    return porteurs.map(toApiModel);
  }
}
