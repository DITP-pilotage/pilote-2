import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export class RestaurerPerimetreHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ perimetreId }: { perimetreId: string }): Promise<void> {
    await this.prisma.getInstance().metadata_perimetres.update({
      where: { perimetre_id: perimetreId },
      data: { deleted_at: null },
    });
  }
}
