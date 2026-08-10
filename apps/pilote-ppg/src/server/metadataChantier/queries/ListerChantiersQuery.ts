import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface ChantierListItem {
  chantierId: string;
  chNom: string;
  chPpg: string;
  chState: $Enums.type_statut;
  chTerrito: boolean;
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
          ch_ppg: true,
          ch_state: true,
          ch_territo: true,
        },
        orderBy: { chantier_id: "asc" },
      });
    return chantiers.map((chantier) => ({
      chantierId: chantier.chantier_id,
      chNom: chantier.ch_nom,
      chPpg: chantier.ch_ppg,
      chState: chantier.ch_state,
      chTerrito: chantier.ch_territo,
    }));
  }
}
