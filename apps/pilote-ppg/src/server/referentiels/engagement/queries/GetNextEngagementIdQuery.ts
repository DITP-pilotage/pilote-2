import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export class GetNextEngagementIdQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<string> {
    const engagements = await this.prisma
      .getInstance()
      .metadata_engagement.findMany({ select: { engagement_id: true } });
    const maxId = engagements.reduce((max, engagement) => {
      const numericId = parseInt(engagement.engagement_id, 10);
      return isNaN(numericId) ? max : Math.max(max, numericId);
    }, 0);
    return String(maxId + 1);
  }
}
