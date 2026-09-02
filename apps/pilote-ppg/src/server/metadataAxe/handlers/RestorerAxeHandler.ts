import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataAxe/module";

export class RestorerAxeHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ axeId }: { axeId: string }): Promise<void> {
    await this.prisma.getInstance().metadata_axes.update({
      where: { axe_id: axeId },
      data: { deleted_at: null },
    });
  }
}
