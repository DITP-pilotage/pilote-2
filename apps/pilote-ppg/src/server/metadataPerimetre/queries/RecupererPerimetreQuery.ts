import type { metadata_perimetres as MetadataPerimetresPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export interface MetadataPerimetre {
  perimetreId: string;
  perNom: string;
  perPorteurId: string | null;
  deletedAt: string | null;
}

function toApiModel(perimetre: MetadataPerimetresPrisma): MetadataPerimetre {
  return {
    perimetreId: perimetre.perimetre_id,
    perNom: perimetre.per_nom,
    perPorteurId: perimetre.per_porteur_id,
    deletedAt: perimetre.deleted_at?.toISOString() ?? null,
  };
}

export class RecupererPerimetreQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    perimetreId,
  }: {
    perimetreId: string;
  }): Promise<MetadataPerimetre> {
    const perimetre = await this.prisma
      .getInstance()
      .metadata_perimetres.findUniqueOrThrow({
        where: { perimetre_id: perimetreId },
      });
    return toApiModel(perimetre);
  }
}
