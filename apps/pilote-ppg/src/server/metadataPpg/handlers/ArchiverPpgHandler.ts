import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPpg/module";
import { VerifierUtilisationPpgQuery } from "@/server/metadataPpg/queries/VerifierUtilisationPpgQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiverPpgHandler {
  private readonly prisma: PrismaPilote;

  private readonly verifierUtilisationPpgQuery: VerifierUtilisationPpgQuery;

  constructor({
    prisma,
    verifierUtilisationPpgQuery,
  }: Inject<"prisma" | "verifierUtilisationPpgQuery">) {
    this.prisma = prisma;
    this.verifierUtilisationPpgQuery = verifierUtilisationPpgQuery;
  }

  async execute({ ppgId }: { ppgId: string }): Promise<void> {
    const { estUtilise, nombreChantiers } =
      await this.verifierUtilisationPpgQuery.run({ ppgId });

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
