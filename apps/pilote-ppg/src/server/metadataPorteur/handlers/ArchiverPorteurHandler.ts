import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";
import { VerifierUtilisationPorteurQuery } from "@/server/metadataPorteur/queries/VerifierUtilisationPorteurQuery";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

export class ArchiverPorteurHandler {
  private readonly prisma: PrismaPilote;

  private readonly verifierUtilisationPorteurQuery: VerifierUtilisationPorteurQuery;

  constructor({
    prisma,
    verifierUtilisationPorteurQuery,
  }: Inject<"prisma" | "verifierUtilisationPorteurQuery">) {
    this.prisma = prisma;
    this.verifierUtilisationPorteurQuery = verifierUtilisationPorteurQuery;
  }

  async execute({ porteurId }: { porteurId: string }): Promise<void> {
    const { estUtilise, nombrePerimetres, nombreChantiers } =
      await this.verifierUtilisationPorteurQuery.run({ porteurId });

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
