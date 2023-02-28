import { chantier, PrismaClient, synthese_des_resultats } from '@prisma/client';
import ChantierRepository, {
  MetriquesChantier,
} from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { AssertionError } from 'node:assert';

function dateToDateStringWithoutTime(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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

  async getMetriques(chantierId: string, maille: Maille, codeInsee: string): Promise<MetriquesChantier> {
    const synthèseDesRésultats: synthese_des_resultats | null = await this.prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
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

    if (synthèseDesRésultats) {

      if (synthèseDesRésultats.commentaire === null || synthèseDesRésultats.date_commentaire === null) {
        throw new AssertionError({
          message: `La requête doit sélectionner un commentaire et une date non null. Synthèse id : ${synthèseDesRésultats.id}`,
        });
      }

      return {
        synthèseDesRésultats: {
          commentaire: synthèseDesRésultats.commentaire,
          date: dateToDateStringWithoutTime(synthèseDesRésultats.date_commentaire),
          auteur: '',
        },
      };
    }

    return {
      synthèseDesRésultats: {
        commentaire: '', // TODO: voir si on met chaine vide ou null
        date: '',
        auteur: '',
      },
    };
  }
}
