import type { metadata_axes as MetadataAxesPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataAxe/module";

export interface AxeAdminListItem {
  axeId: string;
  axeName: string;
  updatedAt: string;
  deletedAt: string | null;
}

function toApiModel(axe: MetadataAxesPrisma): AxeAdminListItem {
  return {
    axeId: axe.axe_id,
    axeName: axe.axe_name,
    updatedAt: axe.updated_at.toISOString(),
    deletedAt: axe.deleted_at?.toISOString() ?? null,
  };
}

export class ListerAxesAdminQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<AxeAdminListItem[]> {
    const axes = await this.prisma.getInstance().metadata_axes.findMany({
      orderBy: [{ updated_at: "desc" }],
    });
    return axes.map(toApiModel);
  }
}
