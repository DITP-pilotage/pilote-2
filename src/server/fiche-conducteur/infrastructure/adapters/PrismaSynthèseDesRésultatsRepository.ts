import { PrismaClient, synthese_des_resultats as SyntheseDesResultatsModel } from '@prisma/client';
import { SynthèseDesRésultatsRepository } from '@/server/fiche-conducteur/domain/ports/SynthèseDesRésultatsRepository';
import { SyntheseDesResultats } from '@/server/fiche-conducteur/domain/SyntheseDesResultats';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

const convertirEnSyntheseDesResultats = (syntheseDesResultatsModel: SyntheseDesResultatsModel): SyntheseDesResultats => {
  return SyntheseDesResultats.creerSyntheseDesResultats({
    meteo: syntheseDesResultatsModel.meteo as Meteo,
    commentaire: syntheseDesResultatsModel.commentaire!,
  });
};

export class PrismaSynthèseDesRésultatsRepository implements SynthèseDesRésultatsRepository {
  constructor(private prismaClient: PrismaClient) {}

  async recupererLaPlusRecenteMailleNatParChantierId(chantierId: string): Promise<SyntheseDesResultats | null> {
    const result = await this.prismaClient.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        maille: 'NAT',
        NOT: [
          {
            commentaire: null,
            date_commentaire: null,
          },
        ],
      },
      orderBy: { date_commentaire: 'desc' },
    });

    if (result === null) {
      return null;
    }

    return convertirEnSyntheseDesResultats(result);
  }
}
