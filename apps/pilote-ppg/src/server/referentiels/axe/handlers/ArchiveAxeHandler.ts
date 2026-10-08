import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { CheckAxeUsageQuery } from "@/server/referentiels/axe/queries/CheckAxeUsageQuery";
import { ConflictError } from "@/shared/errors/conflict-error";

export class ArchiveAxeHandler {
  private readonly prisma: PrismaPilote;

  private readonly checkAxeUsageQuery: CheckAxeUsageQuery;

  constructor({
    prisma,
    checkAxeUsageQuery,
  }: Inject<"prisma" | "checkAxeUsageQuery">) {
    this.prisma = prisma;
    this.checkAxeUsageQuery = checkAxeUsageQuery;
  }

  async execute({ axeId }: { axeId: string }): Promise<void> {
    const { estUtilise, nombrePpgs } = await this.checkAxeUsageQuery.run({
      axeId,
    });

    if (estUtilise) {
      throw new ConflictError(
        `Impossible de supprimer cet axe : il est associé à ${nombrePpgs} PPG.`,
      );
    }

    await this.prisma.getInstance().metadata_axes.update({
      where: { axe_id: axeId },
      data: { deleted_at: new Date() },
    });
  }
}
