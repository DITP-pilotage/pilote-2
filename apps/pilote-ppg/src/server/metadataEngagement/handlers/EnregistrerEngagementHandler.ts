import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataEngagement/module";

export const engagementCommandSchema = z.object({
  engagementId: z.string().min(1),
  engagementShort: z.string().min(1).max(50),
  engagementName: z.string().min(1).max(300),
});

export type EngagementCommand = z.infer<typeof engagementCommandSchema>;

export class EnregistrerEngagementHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: EngagementCommand): Promise<void> {
    const data = {
      engagement_short: command.engagementShort,
      engagement_name: command.engagementName,
    };
    await this.prisma.getInstance().metadata_engagement.upsert({
      where: { engagement_id: command.engagementId },
      create: { engagement_id: command.engagementId, ...data },
      update: data,
    });
  }
}
