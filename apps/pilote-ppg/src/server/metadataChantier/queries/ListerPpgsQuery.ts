import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface Ppg {
  id: string;
  nom: string;
}

export class ListerPpgsQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<Ppg[]> {
    const ppgs = await this.prisma.getInstance().metadata_ppgs.findMany({
      where: { deleted_at: null },
      orderBy: { ppg_id: "asc" },
    });
    return ppgs.map(toApiModel);
  }
}

function toApiModel(p: { ppg_id: string; ppg_nom: string }): Ppg {
  return { id: p.ppg_id, nom: p.ppg_nom };
}
