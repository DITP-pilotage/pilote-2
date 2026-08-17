import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export const perimetreCommandSchema = z.object({
  perimetreId: z.string().regex(/^PER-\d{3}$/),
  perNom: z.string().min(1).max(300),
  perPorteurId: z.string().nullable(),
});

export type PerimetreCommand = z.infer<typeof perimetreCommandSchema>;

export class EnregistrerPerimetreHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: PerimetreCommand): Promise<void> {
    const data = {
      per_nom: command.perNom,
      per_porteur_id: command.perPorteurId,
    };
    await this.prisma.getInstance().metadata_perimetres.upsert({
      where: { perimetre_id: command.perimetreId },
      create: { perimetre_id: command.perimetreId, ...data },
      update: data,
    });
  }
}
