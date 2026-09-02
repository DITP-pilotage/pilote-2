import type { metadata_engagement as MetadataEngagementPrisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataEngagement/module";

export interface EngagementAdminListItem {
  engagementId: string;
  engagementShort: string;
  engagementName: string;
  updatedAt: string;
  deletedAt: string | null;
}

function toApiModel(
  engagement: MetadataEngagementPrisma,
): EngagementAdminListItem {
  return {
    engagementId: engagement.engagement_id,
    engagementShort: engagement.engagement_short,
    engagementName: engagement.engagement_name,
    updatedAt: engagement.updated_at.toISOString(),
    deletedAt: engagement.deleted_at?.toISOString() ?? null,
  };
}

export class ListerEngagementsAdminQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<EngagementAdminListItem[]> {
    const engagements = await this.prisma
      .getInstance()
      .metadata_engagement.findMany({
        orderBy: [{ updated_at: "desc" }],
      });
    return engagements.map(toApiModel);
  }
}
