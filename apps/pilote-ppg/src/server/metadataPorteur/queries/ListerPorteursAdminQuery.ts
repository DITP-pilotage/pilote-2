import type { metadata_porteurs } from "@prisma/client";
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

function toApiModel(
  porteur: Pick<
    metadata_porteurs,
    | "porteur_id"
    | "porteur_short"
    | "porteur_name"
    | "porteur_type_short"
    | "updated_at"
    | "deleted_at"
  >,
): PorteurAdminListItem {
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
