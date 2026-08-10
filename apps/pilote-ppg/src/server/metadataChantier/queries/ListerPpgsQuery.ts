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
    const ppgs = await this.prisma
      .getInstance()
      .metadata_ppgs.findMany({ orderBy: { ppg_id: "asc" } });
    return ppgs.map((p) => ({ id: p.ppg_id, nom: p.ppg_nom }));
  }
}
