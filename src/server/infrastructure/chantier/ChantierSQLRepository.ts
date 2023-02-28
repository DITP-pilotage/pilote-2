import { chantier, PrismaClient, synthese_des_resultats } from '@prisma/client';
import { AssertionError } from 'node:assert';
import ChantierRepository, {
  MetriquesChantier,
} from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { Météo } from '@/server/domain/météo/Météo.interface';
import CommentaireSQLRepository from '@/server/infrastructure/chantier/CommentaireSQLRepository';
import { commentairesNull } from '@/server/domain/chantier/Commentaire.interface';

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
    // TODO: décaler la requête et l'englober dans le SynthèseDesRésultatsSQLRepository (ainsi que le test qui va avec)
    //  cela permettra d'isoler "l'intelligence" de cette récupération de données
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
    
    let métriques: MetriquesChantier = {
      synthèseDesRésultats: {
        contenu: '', // TODO: voir si on met chaine vide ou null
        date: '',
        auteur: '',
      },
      météo: null,
      commentaires: commentairesNull,
    };
    
    if (synthèseDesRésultats) {

      if (synthèseDesRésultats.commentaire === null || synthèseDesRésultats.date_commentaire === null) {
        throw new AssertionError({
          message: `La requête doit sélectionner un commentaire et une date non null. Synthèse id : ${synthèseDesRésultats.id}`,
        });
      }

      métriques['synthèseDesRésultats'] = {
        contenu: synthèseDesRésultats.commentaire,
        date: dateToDateStringWithoutTime(synthèseDesRésultats.date_commentaire),
        auteur: '',
      };
    }

    métriques['météo'] = chantierRow.meteo as Météo ?? 'NON_RENSEIGNEE';

    const commentaireRepository = new CommentaireSQLRepository(this.prisma);

    métriques.commentaires = await commentaireRepository.getByChantierIdAndTerritoire(chantierId, maille, codeInsee);

    return métriques;
  }
}
