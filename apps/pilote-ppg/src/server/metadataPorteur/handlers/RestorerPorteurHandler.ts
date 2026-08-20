import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export class RestorerPorteurHandler {
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
