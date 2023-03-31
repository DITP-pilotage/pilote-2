import { synthese_des_resultats, PrismaClient } from '@prisma/client';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';


export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _toDomain(synthèse: synthese_des_resultats | null): SynthèseDesRésultats {
    if (synthèse === null || synthèse.commentaire === null || synthèse.date_commentaire === null)
      return null;

    return {
      contenu: synthèse.commentaire,
      date: synthèse.date_commentaire.toISOString(),
      auteur: '',
    };
  }
  
  async récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats> {
    const synthèseDesRésultats = await this.prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        NOT: [
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

    return this._toDomain(synthèseDesRésultats);
  }

  async récupérerHistoriqueDeLaSynthèseDesRésultats(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats[]> {
    const synthèsesDesRésultats = await this.prisma.synthese_des_resultats.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
      orderBy: { date_commentaire : 'desc' },
    });

    return synthèsesDesRésultats.map(synthèse => this._toDomain(synthèse));
  }
}
