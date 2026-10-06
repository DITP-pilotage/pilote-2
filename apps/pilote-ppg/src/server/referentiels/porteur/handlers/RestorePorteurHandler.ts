import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export class RestorePorteurHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ porteurId }: { porteurId: string }): Promise<void> {
    await this.prisma.getInstance().metadata_porteurs.update({
      where: { porteur_id: porteurId },
      data: { deleted_at: null },
    });
  }
}
