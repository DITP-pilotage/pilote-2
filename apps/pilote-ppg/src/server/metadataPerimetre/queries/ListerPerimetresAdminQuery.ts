import type {
  metadata_perimetres as MetadataPerimetresPrisma,
  metadata_porteurs as MetadataPorteursPrisma,
} from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export interface PerimetreAdminListItem {
  perimetreId: string;
  perNom: string;
  porteurShort: string | null;
  updatedAt: string;
  deletedAt: string | null;
}

function toApiModel(
  perimetre: MetadataPerimetresPrisma & {
    porteur: MetadataPorteursPrisma | null;
  },
): PerimetreAdminListItem {
  return {
    perimetreId: perimetre.perimetre_id,
    perNom: perimetre.per_nom,
    porteurShort: perimetre.porteur?.porteur_short ?? null,
    updatedAt: perimetre.updated_at.toISOString(),
    deletedAt: perimetre.deleted_at?.toISOString() ?? null,
  };
}

export class ListerPerimetresAdminQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<PerimetreAdminListItem[]> {
    const perimetres = await this.prisma
      .getInstance()
      .metadata_perimetres.findMany({
        include: { porteur: true },
        orderBy: [{ updated_at: "desc" }],
      });
    return perimetres.map(toApiModel);
  }
}
