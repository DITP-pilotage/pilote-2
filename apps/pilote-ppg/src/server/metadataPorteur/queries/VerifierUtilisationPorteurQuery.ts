import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export interface UtilisationPorteur {
  estUtilise: boolean;
  nombrePerimetres: number;
  nombreChantiers: number;
}

export class VerifierUtilisationPorteurQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ porteurId }: { porteurId: string }): Promise<UtilisationPorteur> {
    const instance = this.prisma.getInstance();

    const [nombrePerimetres, nombreChantiers] = await Promise.all([
      instance.metadata_perimetres.count({
        where: { per_porteur_id: porteurId },
      }),
      instance.metadata_chantiers.count({
        where: {
          OR: [
            { porteur_id_principal: porteurId },
            { porteur_ids_secondaires: { has: porteurId } },
            { porteur_ids_DAC: { has: porteurId } },
          ],
        },
      }),
    ]);

    return {
      estUtilise: nombrePerimetres > 0 || nombreChantiers > 0,
      nombrePerimetres,
      nombreChantiers,
    };
  }
}
