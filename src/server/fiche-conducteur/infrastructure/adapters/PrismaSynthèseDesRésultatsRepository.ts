import { synthese_des_resultats as SyntheseDesResultatsModel } from "@prisma/client";
import { SynthèseDesRésultatsRepository } from "@/server/fiche-conducteur/domain/ports/SynthèseDesRésultatsRepository";
import { SyntheseDesResultats } from "@/server/fiche-conducteur/domain/SyntheseDesResultats";
import { Meteo } from "@/server/fiche-conducteur/domain/Meteo";

import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PilotePrismaClient } from "@/server/db/Transaction";

const convertirEnSyntheseDesResultats = (
  syntheseDesResultatsModel: SyntheseDesResultatsModel,
): SyntheseDesResultats => {
  return SyntheseDesResultats.creerSyntheseDesResultats({
    meteo: syntheseDesResultatsModel.meteo as Meteo,
    commentaire: syntheseDesResultatsModel.commentaire!,
  });
};

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaSynthèseDesRésultatsRepository
  implements SynthèseDesRésultatsRepository
{
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async recupererLaPlusRecenteMailleNatParChantierId(
    chantierId: string,
  ): Promise<SyntheseDesResultats | null> {
    const result = await this.prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        maille: "NAT",
        NOT: [
          {
            commentaire: null,
            date_commentaire: null,
          },
        ],
      },
      orderBy: { date_commentaire: "desc" },
    });

    if (result === null) {
      return null;
    }

    return convertirEnSyntheseDesResultats(result);
  }
}
