import type { metadata_engagement as MetadataEngagementPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataEngagement/module";

export interface MetadataEngagement {
  engagementId: string;
  engagementShort: string;
  engagementName: string;
  deletedAt: string | null;
}

function toApiModel(engagement: MetadataEngagementPrisma): MetadataEngagement {
  return {
    engagementId: engagement.engagement_id,
    engagementShort: engagement.engagement_short,
    engagementName: engagement.engagement_name,
    deletedAt: engagement.deleted_at?.toISOString() ?? null,
  };
}

export class RecupererEngagementQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    engagementId,
  }: {
    engagementId: string;
  }): Promise<MetadataEngagement> {
    const engagement = await this.prisma
      .getInstance()
      .metadata_engagement.findUniqueOrThrow({
        where: { engagement_id: engagementId },
      });
    return toApiModel(engagement);
  }
}
