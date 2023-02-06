import { synthese_des_resultats, PrismaClient } from '@prisma/client';
import { AssertionError } from 'node:assert';
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
        NOT : [
          {
            commentaire: null,
          },
          {
            date_commentaire: null,
          },
        ],
      },
      orderBy: { date_commentaire : 'desc' },
    });

    //TODO:
    // - voir la véracité des commentaire vides avec la DITP ? Comportement front ?
    // - formater la date côté front ?

    if (synthèseDesRésultats) {

      if (synthèseDesRésultats.commentaire === null || synthèseDesRésultats.date_commentaire === null) {
        throw new AssertionError({
          message: `La requête doit sélectionner un commentaire et une date non null. Synthèse id : ${synthèseDesRésultats.id}`,
        });
      }

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
