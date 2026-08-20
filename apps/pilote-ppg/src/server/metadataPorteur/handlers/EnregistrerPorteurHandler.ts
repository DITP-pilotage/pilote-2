import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

const PORTEUR_TYPE_SHORTS = ["MIN", "DAC", "AUTRE"] as const;
export type PorteurTypeShort = (typeof PORTEUR_TYPE_SHORTS)[number];

const TYPE_ID_PAR_SHORT: Record<PorteurTypeShort, string> = {
  MIN: "1",
  DAC: "7",
  AUTRE: "5",
};

export const porteurCommandSchema = z.object({
  porteurId: z.string().min(1),
  porteurShort: z.string().min(1).max(20),
  porteurName: z.string().min(1).max(300),
  porteurDesc: z.string().nullable(),
  porteurTypeShort: z.enum(PORTEUR_TYPE_SHORTS),
  porteurDirecteur: z.string().nullable(),
  porteurNameShort: z.string().nullable(),
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
      porteur_type_short: command.porteurTypeShort,
      porteur_type_id: TYPE_ID_PAR_SHORT[command.porteurTypeShort],
      porteur_directeur: command.porteurDirecteur,
      porteur_name_short: command.porteurNameShort,
      porteur_picto: command.porteurPicto,
    };
    await this.prisma.getInstance().metadata_porteurs.upsert({
      where: { porteur_id: command.porteurId },
      create: { porteur_id: command.porteurId, ...data },
      update: data,
    });
  }
}
