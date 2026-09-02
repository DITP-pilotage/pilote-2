import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPpg/module";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

export const ppgCommandSchema = z.object({
  ppgId: z.string().min(1),
  ppgNom: z.string().min(1).max(300),
  ppgDesc: z.string().nullable(),
  ppgAxe: z.string().nullable(),
  estUneCréation: z.boolean(),
});

export type PpgCommand = z.infer<typeof ppgCommandSchema>;

export class EnregistrerPpgHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: PpgCommand): Promise<void> {
    const instance = this.prisma.getInstance();

    if (command.estUneCréation) {
      const existant = await instance.metadata_ppgs.findUnique({
        where: { ppg_id: command.ppgId },
      });
      if (existant) {
        throw new BadRequestError(
          `Un PPG avec l'identifiant "${command.ppgId}" existe déjà.`,
        );
      }
    }

    const data = {
      ppg_nom: command.ppgNom,
      ppg_desc: command.ppgDesc,
      ppg_axe: command.ppgAxe,
    };
    await instance.metadata_ppgs.upsert({
      where: { ppg_id: command.ppgId },
      create: { ppg_id: command.ppgId, ...data },
      update: data,
    });
  }
}
