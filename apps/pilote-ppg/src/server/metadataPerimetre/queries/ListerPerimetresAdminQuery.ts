import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export interface PerimetreAdminListItem {
  perimetreId: string;
  perNom: string;
  porteurShort: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
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
        select: {
          perimetre_id: true,
          per_nom: true,
          updated_at: true,
          deleted_at: true,
          porteur: { select: { porteur_short: true } },
        },
        orderBy: [{ updated_at: "desc" }],
      });
    return perimetres.map((p) => ({
      perimetreId: p.perimetre_id,
      perNom: p.per_nom,
      porteurShort: p.porteur?.porteur_short ?? null,
      updatedAt: p.updated_at,
      deletedAt: p.deleted_at,
    }));
  }
}
