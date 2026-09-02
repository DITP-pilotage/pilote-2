import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataEngagement/module";
import { VerifierUtilisationEngagementQuery } from "@/server/metadataEngagement/queries/VerifierUtilisationEngagementQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiverEngagementHandler {
  private readonly prisma: PrismaPilote;

  private readonly verifierUtilisationEngagementQuery: VerifierUtilisationEngagementQuery;

  constructor({
    prisma,
    verifierUtilisationEngagementQuery,
  }: Inject<"prisma" | "verifierUtilisationEngagementQuery">) {
    this.prisma = prisma;
    this.verifierUtilisationEngagementQuery =
      verifierUtilisationEngagementQuery;
  }

  async execute({ engagementId }: { engagementId: string }): Promise<void> {
    const engagement = await this.prisma
      .getInstance()
      .metadata_engagement.findUniqueOrThrow({
        where: { engagement_id: engagementId },
      });

    const { estUtilise, nombreChantiers } =
      await this.verifierUtilisationEngagementQuery.run({
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
