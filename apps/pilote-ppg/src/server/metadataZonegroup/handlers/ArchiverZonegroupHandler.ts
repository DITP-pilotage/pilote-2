import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataZonegroup/module";
import { VerifierUtilisationZonegroupQuery } from "@/server/metadataZonegroup/queries/VerifierUtilisationZonegroupQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiverZonegroupHandler {
  private readonly prisma: PrismaPilote;

  private readonly verifierUtilisationZonegroupQuery: VerifierUtilisationZonegroupQuery;

  constructor({
    prisma,
    verifierUtilisationZonegroupQuery,
  }: Inject<"prisma" | "verifierUtilisationZonegroupQuery">) {
    this.prisma = prisma;
    this.verifierUtilisationZonegroupQuery = verifierUtilisationZonegroupQuery;
  }

  async execute({ zoneGroupId }: { zoneGroupId: string }): Promise<void> {
    const { estUtilise, nombreChantiers, nombreIndicateurs } =
      await this.verifierUtilisationZonegroupQuery.run({ zoneGroupId });

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
