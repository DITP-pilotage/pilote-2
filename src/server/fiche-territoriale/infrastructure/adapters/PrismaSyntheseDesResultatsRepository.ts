import { PrismaClient } from '@prisma/client';
import { SyntheseDesResultatsRepository } from '@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository';
import { SyntheseDesResultats } from '@/server/fiche-territoriale/domain/SyntheseDesResultats';

export class PrismaSyntheseDesResultatsRepository implements SyntheseDesResultatsRepository {
  constructor(private prismaClient: PrismaClient) {}

  async recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire({ listeChantierId, maille, codeInsee }: {
    listeChantierId: string[],
    maille: string,
    codeInsee: string
  }): Promise<Map<string, SyntheseDesResultats[]>> {
    const result = await this.prismaClient.synthese_des_resultats.findMany({
      where: {
        chantier_id: {
          in: listeChantierId,
        },
        code_insee: codeInsee,
        maille,
      },
    });

    return result.reduce((acc, val) => {
      const syntheseDesResultats = SyntheseDesResultats.creerSyntheseDesResultats({
        dateMeteo: val.date_meteo?.toISOString() || '',
        dateCommentaire: val.date_commentaire?.toISOString() || '',
      });

      acc.set(val.chantier_id, [...(acc.get(val.chantier_id) || []), syntheseDesResultats]);
      return acc;
    }, new Map<string, SyntheseDesResultats[]>());
  }
}
