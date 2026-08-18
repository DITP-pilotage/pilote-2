import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export interface MetadataPorteur {
  porteurId: string;
  porteurShort: string;
  porteurName: string;
  porteurDesc: string | null;
  porteurTypeShort: string | null;
  porteurDirecteur: string | null;
  porteurNameShort: string | null;
  porteurPicto: string | null;
  deletedAt: string | null;
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
    return {
      porteurId: porteur.porteur_id,
      porteurShort: porteur.porteur_short,
      porteurName: porteur.porteur_name,
      porteurDesc: porteur.porteur_desc,
      porteurTypeShort: porteur.porteur_type_short,
      porteurDirecteur: porteur.porteur_directeur,
      porteurNameShort: porteur.porteur_name_short,
      porteurPicto: porteur.porteur_picto,
      deletedAt: porteur.deleted_at?.toISOString() ?? null,
    };
  }
}
