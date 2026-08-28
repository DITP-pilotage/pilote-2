import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";
import { VerifierUtilisationPerimetreQuery } from "@/server/metadataPerimetre/queries/VerifierUtilisationPerimetreQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiverPerimetreHandler {
  private readonly prisma: PrismaPilote;

  private readonly verifierUtilisationPerimetreQuery: VerifierUtilisationPerimetreQuery;

  constructor({
    prisma,
    verifierUtilisationPerimetreQuery,
  }: Inject<"prisma" | "verifierUtilisationPerimetreQuery">) {
    this.prisma = prisma;
    this.verifierUtilisationPerimetreQuery = verifierUtilisationPerimetreQuery;
  }

  async execute({ perimetreId }: { perimetreId: string }): Promise<void> {
    const { estUtilise, nombreChantiers } =
      await this.verifierUtilisationPerimetreQuery.run({ perimetreId });

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
