import type { metadata_ppgs as MetadataPpgsPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPpg/module";

export interface MetadataPpg {
  ppgId: string;
  ppgNom: string;
  ppgDesc: string | null;
  ppgAxe: string | null;
  deletedAt: string | null;
}

function toApiModel(ppg: MetadataPpgsPrisma): MetadataPpg {
  return {
    ppgId: ppg.ppg_id,
    ppgNom: ppg.ppg_nom,
    ppgDesc: ppg.ppg_desc,
    ppgAxe: ppg.ppg_axe,
    deletedAt: ppg.deleted_at?.toISOString() ?? null,
  };
}

export class RecupererPpgQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ ppgId }: { ppgId: string }): Promise<MetadataPpg> {
    const ppg = await this.prisma
      .getInstance()
      .metadata_ppgs.findUniqueOrThrow({
        where: { ppg_id: ppgId },
      });
    return toApiModel(ppg);
  }
}
