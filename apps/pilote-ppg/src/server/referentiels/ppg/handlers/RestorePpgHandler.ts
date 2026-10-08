import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export class RestorePpgHandler {
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
