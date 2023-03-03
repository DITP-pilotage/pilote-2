import { chantier, PrismaClient } from '@prisma/client';
import ChantierRepository, {
  InfosChantier,
} from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { Météo } from '@/server/domain/météo/Météo.interface';
import CommentaireSQLRepository from '@/server/infrastructure/chantier/CommentaireSQLRepository';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/SynthèseDesRésultatsRepository.interface';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/chantier/SynthèseDesRésultatsSQLRepository';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getById(id: string): Promise<Chantier> {
    const chantiers: chantier[] = await this.prisma.chantier.findMany({
      where: { id },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return parseChantier(chantiers);
  }

  async getListe(): Promise<Chantier[]> {
    const chantiers = await this.prisma.chantier.findMany({
      where: {
        NOT: { ministeres: { isEmpty: true } },
      },
    });
    const chantiersGroupésParId = groupBy<chantier>(chantiers, c => c.id);

    return objectEntries(chantiersGroupésParId).map(([_, c]) => parseChantier(c));
  }

  async getInfosChantier(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<InfosChantier> {
    const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(this.prisma);
    const commentaireRepository = new CommentaireSQLRepository(this.prisma);

    const chantierRow: chantier | null = await this.prisma.chantier.findFirst({
      where: {
        id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
    });

    if (!chantierRow) {
      throw new ErreurChantierNonTrouvé(chantierId);
    }
    
    let infosChantier: InfosChantier = {
      synthèseDesRésultats: await synthèseDesRésultatsRepository.findNewestByChantierIdAndTerritoire(chantierId, maille, codeInsee),
      météo: chantierRow.meteo as Météo ?? 'NON_RENSEIGNEE',
      commentaires: await commentaireRepository.findNewestByChantierIdAndTerritoire(chantierId, maille, codeInsee),
    };

    return infosChantier;
  }
}
