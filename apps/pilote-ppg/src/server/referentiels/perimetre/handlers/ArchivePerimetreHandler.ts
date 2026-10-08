import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { CheckPerimetreUsageQuery } from "@/server/referentiels/perimetre/queries/CheckPerimetreUsageQuery";
import { ConflictError } from "@/shared/errors/conflict-error";

export class ArchivePerimetreHandler {
  private readonly prisma: PrismaPilote;

  private readonly checkPerimetreUsageQuery: CheckPerimetreUsageQuery;

  constructor({
    prisma,
    checkPerimetreUsageQuery,
  }: Inject<"prisma" | "checkPerimetreUsageQuery">) {
    this.prisma = prisma;
    this.checkPerimetreUsageQuery = checkPerimetreUsageQuery;
  }

  async execute({ perimetreId }: { perimetreId: string }): Promise<void> {
    const { estUtilise, nombreChantiers } =
      await this.checkPerimetreUsageQuery.run({ perimetreId });

    if (estUtilise) {
      throw new ConflictError(
        `Impossible de supprimer ce périmètre : il est associé à ${nombreChantiers} chantier(s).`,
      );
    }

    await this.prisma.getInstance().metadata_perimetres.update({
      where: { perimetre_id: perimetreId },
      data: { deleted_at: new Date() },
    });
  }
}
