import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataEngagement/module";

export class RecupererIdSuivantEngagementQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<string> {
    const engagements = await this.prisma
      .getInstance()
      .metadata_engagement.findMany({ select: { engagement_id: true } });
    const maxId = engagements.reduce((max, engagement) => {
      const idNumérique = parseInt(engagement.engagement_id, 10);
      return isNaN(idNumérique) ? max : Math.max(max, idNumérique);
    }, 0);
    return String(maxId + 1);
  }
}
