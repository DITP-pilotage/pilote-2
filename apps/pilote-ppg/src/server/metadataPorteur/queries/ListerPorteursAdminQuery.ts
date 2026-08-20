import type { metadata_porteurs as MetadataPorteursPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export interface PorteurAdminListItem {
  porteurId: string;
  porteurShort: string;
  porteurName: string;
  porteurTypeShort: string | null;
  updatedAt: string;
  deletedAt: string | null;
}

function toApiModel(porteur: MetadataPorteursPrisma): PorteurAdminListItem {
  return {
    porteurId: porteur.porteur_id,
    porteurShort: porteur.porteur_short,
    porteurName: porteur.porteur_name,
    porteurTypeShort: porteur.porteur_type_short,
    updatedAt: porteur.updated_at.toISOString(),
    deletedAt: porteur.deleted_at?.toISOString() ?? null,
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
        orderBy: [{ updated_at: "desc" }],
      });
    return porteurs.map(toApiModel);
  }
}
