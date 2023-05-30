import { synthese_des_resultats_projet_structurant as SynthèseDesRésultatsProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import { Météo } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultatsProjetStructurant from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export class SynthèseDesRésultatsProjetStructurantSQLRepository implements SynthèseDesRésultatsProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(synthèse: SynthèseDesRésultatsProjetStructurantPrisma | null): SynthèseDesRésultatsProjetStructurant {
    if (synthèse === null || synthèse.commentaire === null || synthèse.date_commentaire === null)
      return null;

    return {
      id: synthèse.id,
      contenu: synthèse.commentaire,
      date: synthèse.date_commentaire.toISOString(),
      auteur: synthèse.auteur ?? '',
      météo: synthèse.meteo as Météo ?? 'NON_RENSEIGNEE',
    };
  }
  
  async récupérerLaPlusRécente(projetStructurantId: string): Promise<SynthèseDesRésultatsProjetStructurant> {
    const synthèseDesRésultats = await this.prisma.synthese_des_resultats_projet_structurant.findFirst({
      where: {
        projet_structurant_id: projetStructurantId,
        NOT: [
          {
            commentaire: null,
          },
          {
            date_commentaire: null,
          },
        ],
      },
      orderBy: { date_commentaire: 'desc' },
    });

    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  async récupérerToutesLesMétéosLesPlusRécentes(): Promise<{ projetStructurantId: string, météo: Météo }[]> {
    const couplesPSetMétéo = await this.prisma.$queryRaw<{ projet_structurant_id: string, meteo: Météo }[]>`
        select projet_structurant_id, meteo
        from (
          select *,
          row_number() over (
              partition by projet_structurant_id order by date_commentaire desc
          ) r
          from synthese_des_resultats_projet_structurant s
          where date_commentaire is not null
        ) sr
        where sr.r = 1
    `;

    return couplesPSetMétéo.map((couple) => ({
      projetStructurantId: couple.projet_structurant_id,
      météo: couple.meteo,
    }));
  }
}
