import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";
import { CheckPpgUsageQuery } from "@/server/referentiels/ppg/queries/CheckPpgUsageQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchivePpgHandler {
  private readonly prisma: PrismaPilote;

  private readonly checkPpgUsageQuery: CheckPpgUsageQuery;

  constructor({
    prisma,
    checkPpgUsageQuery,
  }: Inject<"prisma" | "checkPpgUsageQuery">) {
    this.prisma = prisma;
    this.checkPpgUsageQuery = checkPpgUsageQuery;
  }

  async execute({ ppgId }: { ppgId: string }): Promise<void> {
    const { estUtilise, nombreChantiers } = await this.checkPpgUsageQuery.run({
      ppgId,
    });

    if (estUtilise) {
      throw new ConflictError(
        `Impossible de supprimer ce PPG : il est associé à ${nombreChantiers} chantier(s).`,
      );
    }

    await this.prisma.getInstance().metadata_ppgs.update({
      where: { ppg_id: ppgId },
      data: { deleted_at: new Date() },
    });
  }
}
