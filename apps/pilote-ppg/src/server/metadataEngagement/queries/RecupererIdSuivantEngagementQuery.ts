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
    const maxId = engagements.reduce((max, e) => {
      const n = parseInt(e.engagement_id, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return String(maxId + 1);
  }
}
