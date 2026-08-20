import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export class ArchiverOuRestorerPerimetreHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({
    perimetreId,
    restaurer,
  }: {
    perimetreId: string;
    restaurer?: boolean;
  }): Promise<void> {
    await this.prisma.getInstance().metadata_perimetres.update({
      where: { perimetre_id: perimetreId },
      data: { deleted_at: restaurer ? null : new Date() },
    });
  }
}
