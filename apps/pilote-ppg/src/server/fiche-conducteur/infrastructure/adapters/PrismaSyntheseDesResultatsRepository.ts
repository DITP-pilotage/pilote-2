import {
  $Enums,
  synthese_des_resultats as SyntheseDesResultatsModel,
} from "@prisma/client";
import { SyntheseDesResultatsRepository } from "@/server/fiche-conducteur/domain/ports/SyntheseDesResultatsRepository";
import { SyntheseDesResultats } from "@/server/fiche-conducteur/domain/SyntheseDesResultats";
import { Meteo } from "@/server/fiche-conducteur/domain/Meteo";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";

const convertirEnSyntheseDesResultats = (
  syntheseDesResultatsModel: SyntheseDesResultatsModel,
): SyntheseDesResultats => {
  return SyntheseDesResultats.creerSyntheseDesResultats({
    meteo: syntheseDesResultatsModel.meteo as Meteo,
    commentaire: syntheseDesResultatsModel.commentaire!,
  });
};

export class PrismaSyntheseDesResultatsRepository implements SyntheseDesResultatsRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async recupererLaPlusRecenteMailleNatParChantierId(
    chantierId: string,
  ): Promise<SyntheseDesResultats | null> {
    const result = await this.prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        statut: $Enums.statut_publication.PUBLIE,
        maille: "NAT",
        NOT: [
          {
            commentaire: null,
          },
        ],
      },
      orderBy: { date_modification: "desc" },
    });

    if (result === null) {
      return null;
    }

    return convertirEnSyntheseDesResultats(result);
  }
}
