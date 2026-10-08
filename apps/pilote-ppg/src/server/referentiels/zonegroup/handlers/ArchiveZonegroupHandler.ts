import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { CheckZonegroupUsageQuery } from "@/server/referentiels/zonegroup/queries/CheckZonegroupUsageQuery";
import { ConflictError } from "@/shared/errors/conflict-error";

export class ArchiveZonegroupHandler {
  private readonly prisma: PrismaPilote;

  private readonly checkZonegroupUsageQuery: CheckZonegroupUsageQuery;

  constructor({
    prisma,
    checkZonegroupUsageQuery,
  }: Inject<"prisma" | "checkZonegroupUsageQuery">) {
    this.prisma = prisma;
    this.checkZonegroupUsageQuery = checkZonegroupUsageQuery;
  }

  async execute({ zoneGroupId }: { zoneGroupId: string }): Promise<void> {
    const { estUtilise, nombreChantiers, nombreIndicateurs } =
      await this.checkZonegroupUsageQuery.run({ zoneGroupId });

    if (estUtilise) {
      const raisons = [
        nombreChantiers > 0 ? `${nombreChantiers} chantier(s)` : null,
        nombreIndicateurs > 0 ? `${nombreIndicateurs} indicateur(s)` : null,
      ].filter(Boolean);
      throw new ConflictError(
        `Impossible de supprimer cette zone-groupe : elle est associée à ${raisons.join(" et ")}.`,
      );
    }

    await this.prisma.getInstance().metadata_zonegroup.update({
      where: { zone_group_id: zoneGroupId },
      data: { deleted_at: new Date() },
    });
  }
}
