import { synthese_des_resultats, PrismaClient } from '@prisma/client';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';

export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findNewestByChantierId(chantierId: string): Promise<SynthèseDesRésultats | null> {
    const synthèseDesRésultats: synthese_des_resultats | null = await this.prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id : chantierId,
        maille: 'NAT',
        code_insee: 'FR',
        NOT : {
          commentaire: null,
          date_commentaire: null,
        },
      },
      orderBy: { date_commentaire : 'desc' },
    });

    //TODO:
    // - gestion des données nulles au niveau de l'interface ? Typage des données ?
    // - voir la véracité des commentaire vides avec la DITP ? Comportement front ?
    // - formater la date côté front ?

    if (synthèseDesRésultats) {
      return {
        commentaireSynthèse : {
          contenu : synthèseDesRésultats.commentaire,
          date: synthèseDesRésultats.date_commentaire.toLocaleDateString('fr-FR'),
        },
      };    
    }

    return null;
  }
}
