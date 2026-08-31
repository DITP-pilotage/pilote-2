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

  async run({ porteurId }: { porteurId?: string } = {}): Promise<Perimetre[]> {
    const perimetres = await this.prisma
      .getInstance()
      .metadata_perimetres.findMany({
        where: {
          deleted_at: null,
          ...(porteurId ? { per_porteur_id: porteurId } : {}),
        },
        orderBy: { perimetre_id: "asc" },
      });
    return perimetres.map(toApiModel);
  }
}

function toApiModel(p: { perimetre_id: string; per_nom: string }): Perimetre {
  return { id: p.perimetre_id, nom: p.per_nom };
}
