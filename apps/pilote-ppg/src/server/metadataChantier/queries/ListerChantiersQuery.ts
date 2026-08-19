import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface ChantierListItem {
  chantierId: string;
  chNom: string;
  chState: $Enums.type_statut;
  updatedAt: Date;
}

export class ListerChantiersQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<ChantierListItem[]> {
    const chantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.findMany({
        select: {
          chantier_id: true,
          ch_nom: true,
          ch_state: true,
          updated_at: true,
        },
        orderBy: { updated_at: "desc" },
      });
    return chantiers.map((chantier) => ({
      chantierId: chantier.chantier_id,
      chNom: chantier.ch_nom,
      chState: chantier.ch_state,
      updatedAt: chantier.updated_at,
    }));
  }
}
