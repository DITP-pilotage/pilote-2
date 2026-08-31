import { z } from "zod";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export const porteurCommandSchema = z.object({
  porteurId: z.string().min(1),
  porteurShort: z.string().min(1).max(20),
  porteurName: z.string().min(1).max(300),
  porteurDesc: z.string().nullable(),
  porteurType: z.nativeEnum($Enums.porteur_type),
  porteurDirecteur: z.string().nullable(),
  porteurPicto: z.string().nullable(),
});

export type PorteurCommand = z.infer<typeof porteurCommandSchema>;

export class EnregistrerPorteurHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: PorteurCommand): Promise<void> {
    const data = {
      porteur_short: command.porteurShort,
      porteur_name: command.porteurName,
      porteur_desc: command.porteurDesc,
      porteur_type: command.porteurType,
      porteur_directeur: command.porteurDirecteur,
      porteur_picto: command.porteurPicto,
    };
    await this.prisma.getInstance().metadata_porteurs.upsert({
      where: { porteur_id: command.porteurId },
      create: { porteur_id: command.porteurId, ...data },
      update: data,
    });
  }
}
