import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataAxe/module";
import { VerifierUtilisationAxeQuery } from "@/server/metadataAxe/queries/VerifierUtilisationAxeQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiverAxeHandler {
  private readonly prisma: PrismaPilote;

  private readonly verifierUtilisationAxeQuery: VerifierUtilisationAxeQuery;

  constructor({
    prisma,
    verifierUtilisationAxeQuery,
  }: Inject<"prisma" | "verifierUtilisationAxeQuery">) {
    this.prisma = prisma;
    this.verifierUtilisationAxeQuery = verifierUtilisationAxeQuery;
  }

  async execute({ axeId }: { axeId: string }): Promise<void> {
    const { estUtilise, nombrePpgs } =
      await this.verifierUtilisationAxeQuery.run({ axeId });

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
