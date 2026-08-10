import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface Perimetre {
  id: string;
  nom: string;
}

export class ListerPerimetresQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<Perimetre[]> {
    const perimetres = await this.prisma
      .getInstance()
      .metadata_perimetres.findMany({ orderBy: { perimetre_id: "asc" } });
    return perimetres.map((p) => ({ id: p.perimetre_id, nom: p.per_nom }));
  }
}
