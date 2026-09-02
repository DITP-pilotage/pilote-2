import type { metadata_axes as MetadataAxesPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataAxe/module";

export interface MetadataAxe {
  axeId: string;
  axeName: string;
  axeDesc: string | null;
  deletedAt: string | null;
}

function toApiModel(axe: MetadataAxesPrisma): MetadataAxe {
  return {
    axeId: axe.axe_id,
    axeName: axe.axe_name,
    axeDesc: axe.axe_desc,
    deletedAt: axe.deleted_at?.toISOString() ?? null,
  };
}

export class RecupererAxeQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ axeId }: { axeId: string }): Promise<MetadataAxe> {
    const axe = await this.prisma
      .getInstance()
      .metadata_axes.findUniqueOrThrow({
        where: { axe_id: axeId },
      });
    return toApiModel(axe);
  }
}
