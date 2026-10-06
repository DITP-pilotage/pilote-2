import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { CheckPorteurUsageQuery } from "@/server/referentiels/porteur/queries/CheckPorteurUsageQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchivePorteurHandler {
  private readonly prisma: PrismaPilote;

  private readonly checkPorteurUsageQuery: CheckPorteurUsageQuery;

  constructor({
    prisma,
    checkPorteurUsageQuery,
  }: Inject<"prisma" | "checkPorteurUsageQuery">) {
    this.prisma = prisma;
    this.checkPorteurUsageQuery = checkPorteurUsageQuery;
  }

  async execute({ porteurId }: { porteurId: string }): Promise<void> {
    const { estUtilise, nombrePerimetres, nombreChantiers } =
      await this.checkPorteurUsageQuery.run({ porteurId });

    if (estUtilise) {
      const raisons = [
        nombrePerimetres > 0 ? `${nombrePerimetres} périmètre(s)` : null,
        nombreChantiers > 0 ? `${nombreChantiers} chantier(s)` : null,
      ].filter(Boolean);
      throw new ConflictError(
        `Impossible de supprimer ce porteur : il est associé à ${raisons.join(" et ")}.`,
      );
    }

    await this.prisma.getInstance().metadata_porteurs.update({
      where: { porteur_id: porteurId },
      data: { deleted_at: new Date() },
    });
  }
}
