import { $Enums } from "@prisma/client";
import type { metadata_porteurs as MetadataPorteursPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export interface MetadataPorteur {
  porteurId: string;
  porteurShort: string;
  porteurName: string;
  porteurDesc: string | null;
  porteurType: $Enums.porteur_type;
  porteurDirecteur: string | null;
  porteurPicto: string | null;
  deletedAt: string | null;
}

function toApiModel(porteur: MetadataPorteursPrisma): MetadataPorteur {
  return {
    porteurId: porteur.porteur_id,
    porteurShort: porteur.porteur_short,
    porteurName: porteur.porteur_name,
    porteurDesc: porteur.porteur_desc,
    porteurType: porteur.porteur_type,
    porteurDirecteur: porteur.porteur_directeur,
    porteurPicto: porteur.porteur_picto,
    deletedAt: porteur.deleted_at?.toISOString() ?? null,
  };
}

export class RecupererPorteurQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ porteurId }: { porteurId: string }): Promise<MetadataPorteur> {
    const porteur = await this.prisma
      .getInstance()
      .metadata_porteurs.findUniqueOrThrow({
        where: { porteur_id: porteurId },
      });
    return toApiModel(porteur);
  }
}
