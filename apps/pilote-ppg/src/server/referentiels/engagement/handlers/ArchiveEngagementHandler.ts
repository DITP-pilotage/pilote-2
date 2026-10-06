import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { CheckEngagementUsageQuery } from "@/server/referentiels/engagement/queries/CheckEngagementUsageQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiveEngagementHandler {
  private readonly prisma: PrismaPilote;

  private readonly checkEngagementUsageQuery: CheckEngagementUsageQuery;

  constructor({
    prisma,
    checkEngagementUsageQuery,
  }: Inject<"prisma" | "checkEngagementUsageQuery">) {
    this.prisma = prisma;
    this.checkEngagementUsageQuery = checkEngagementUsageQuery;
  }

  async execute({ engagementId }: { engagementId: string }): Promise<void> {
    const engagement = await this.prisma
      .getInstance()
      .metadata_engagement.findUniqueOrThrow({
        where: { engagement_id: engagementId },
      });

    const { estUtilise, nombreChantiers } =
      await this.checkEngagementUsageQuery.run({
        engagementShort: engagement.engagement_short,
      });

    if (estUtilise) {
      throw new ConflictError(
        `Impossible de supprimer cet engagement : il est associé à ${nombreChantiers} chantier(s).`,
      );
    }

    await this.prisma.getInstance().metadata_engagement.update({
      where: { engagement_id: engagementId },
      data: { deleted_at: new Date() },
    });
  }
}
