import { synthese_des_resultats_projet_structurant, PrismaClient } from '@prisma/client';
import { Météo } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultatsProjetStructurant from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export class SynthèseDesRésultatsProjetStructurantSQLRepository implements SynthèseDesRésultatsProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(synthèse: synthese_des_resultats_projet_structurant | null): SynthèseDesRésultatsProjetStructurant {
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
}
