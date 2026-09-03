import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPpg/module";

export class RestorerPpgHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ ppgId }: { ppgId: string }): Promise<void> {
    await this.prisma.getInstance().metadata_ppgs.update({
      where: { ppg_id: ppgId },
      data: { deleted_at: null },
    });
  }
}
