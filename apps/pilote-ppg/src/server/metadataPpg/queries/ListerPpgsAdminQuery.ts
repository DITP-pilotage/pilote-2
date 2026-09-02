import type { metadata_ppgs as MetadataPpgsPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPpg/module";

export interface PpgAdminListItem {
  ppgId: string;
  ppgNom: string;
  ppgAxe: string | null;
  updatedAt: string;
  deletedAt: string | null;
}

function toApiModel(ppg: MetadataPpgsPrisma): PpgAdminListItem {
  return {
    ppgId: ppg.ppg_id,
    ppgNom: ppg.ppg_nom,
    ppgAxe: ppg.ppg_axe,
    updatedAt: ppg.updated_at.toISOString(),
    deletedAt: ppg.deleted_at?.toISOString() ?? null,
  };
}

export class ListerPpgsAdminQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<PpgAdminListItem[]> {
    const ppgs = await this.prisma.getInstance().metadata_ppgs.findMany({
      orderBy: [{ updated_at: "desc" }],
    });
    return ppgs.map(toApiModel);
  }
}
