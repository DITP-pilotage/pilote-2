import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { BadRequestError } from "@/shared/errors/bad-request-error";

export const axeCommandSchema = z.object({
  axeId: z.string().min(1),
  axeName: z.string().min(1).max(300),
  axeDesc: z.string().nullable(),
  isCreation: z.boolean(),
});

export type AxeCommand = z.infer<typeof axeCommandSchema>;

export class SaveAxeHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: AxeCommand): Promise<void> {
    const instance = this.prisma.getInstance();

    if (command.isCreation) {
      const existant = await instance.metadata_axes.findUnique({
        where: { axe_id: command.axeId },
      });
      if (existant) {
        throw new BadRequestError(
          `Un axe avec l'identifiant "${command.axeId}" existe déjà.`,
        );
      }
    }

    const data = {
      axe_name: command.axeName,
      axe_desc: command.axeDesc,
    };
    await instance.metadata_axes.upsert({
      where: { axe_id: command.axeId },
      create: { axe_id: command.axeId, ...data },
      update: data,
    });
  }
}
