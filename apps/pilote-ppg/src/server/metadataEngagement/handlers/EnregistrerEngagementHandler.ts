import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataEngagement/module";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

export const engagementCommandSchema = z.object({
  engagementId: z.string().min(1),
  engagementShort: z.string().min(1).max(50),
  engagementName: z.string().min(1).max(300),
  estUneCréation: z.boolean(),
});

export type EngagementCommand = z.infer<typeof engagementCommandSchema>;

export class EnregistrerEngagementHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: EngagementCommand): Promise<void> {
    const instance = this.prisma.getInstance();

    if (command.estUneCréation) {
      const existant = await instance.metadata_engagement.findUnique({
        where: { engagement_id: command.engagementId },
      });
      if (existant) {
        throw new BadRequestError(
          `Un engagement avec l'identifiant "${command.engagementId}" existe déjà.`,
        );
      }
    }

    const data = {
      engagement_short: command.engagementShort,
      engagement_name: command.engagementName,
    };
    await instance.metadata_engagement.upsert({
      where: { engagement_id: command.engagementId },
      create: { engagement_id: command.engagementId, ...data },
      update: data,
    });
  }
}
