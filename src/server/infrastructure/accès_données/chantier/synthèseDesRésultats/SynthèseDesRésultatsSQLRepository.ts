import { synthese_des_resultats, utilisateur as UtilisateurPrisma } from '@prisma/client';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { prisma } from '@/server/db/prisma';

export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  private mapperVersDomaine(synthèse: synthese_des_resultats & { auteur_synthese: UtilisateurPrisma | null } | null): SynthèseDesRésultats {
    if (synthèse === null || synthèse.commentaire === null || synthèse.date_commentaire === null)
      return null;
    const auteurSynthese = synthèse.auteur_synthese;
    return {
      id: synthèse.id,
      contenu: synthèse.commentaire,
      date: synthèse.date_commentaire.toISOString(),
      auteur: auteurSynthese ? `${auteurSynthese.prenom} ${auteurSynthese.nom}` : 'Auteur Inconnu',
      météo: synthèse.meteo as Météo ?? 'NON_RENSEIGNEE',
    };
  }

  async créer(chantierId: string, territoireCode: string, id: string, contenu: string, auteur_id: string, météo: Météo, date: Date): Promise<SynthèseDesRésultats> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const synthèseDesRésultats =  await prisma.synthese_des_resultats.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: maille,
        code_insee: codeInsee,
        territoire_code: territoireCode,
        commentaire: contenu,
        meteo: météo,
        date_commentaire: date,
        date_meteo: date,
        auteur_id: auteur_id,
      },
      include: {
        auteur_synthese: true,
      },
    });
    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  async récupérerLaPlusRécente(chantierId: string, territoireCode: string): Promise<SynthèseDesRésultats> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);
    
    const synthèseDesRésultats = await prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        maille: maille,
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
      include: {
        auteur_synthese: true,
      },
      orderBy: { date_commentaire: 'desc' },
    });

    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  async récupérerHistorique(chantierId: string, territoireCode: string): Promise<SynthèseDesRésultats[]> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);
    
    const synthèsesDesRésultats = await prisma.synthese_des_resultats.findMany({
      where: {
        chantier_id: chantierId,
        maille: maille,
        code_insee: codeInsee,
      },
      include: {
        auteur_synthese: true,
      },
      orderBy: { date_commentaire: 'desc' },
    });

    return synthèsesDesRésultats
      .map(synthèse => this.mapperVersDomaine(synthèse))
      .filter(synthèse => synthèse !== null);
  }

  async récupérerLesPlusRécentesGroupéesParChantier(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<Chantier['id'], SynthèseDesRésultats>> {
    const synthèsesDesRésultats = await prisma.$queryRaw<(synthese_des_resultats & { auteur_prenom: string, auteur_nom: string })[]>`
      SELECT s.*, utilisateur.prenom as auteur_prenom, utilisateur.nom as auteur_nom
      FROM synthese_des_resultats s
        LEFT JOIN utilisateur on utilisateur.id = s.auteur_id
        INNER JOIN (
          SELECT chantier_id, maille, code_insee, MAX(date_commentaire) as maxdate
          FROM synthese_des_resultats
          WHERE chantier_id = ANY (${chantiersIds})
            AND maille = ${CODES_MAILLES[maille]}
            AND code_insee = ${codeInsee}
          GROUP BY chantier_id, maille, code_insee
        ) s_recentes
          ON s.date_commentaire = s_recentes.maxdate
            AND s.chantier_id = s_recentes.chantier_id
            AND s.maille = s_recentes.maille
            AND s.code_insee = s_recentes.code_insee
      `;    

    return Object.fromEntries(
      synthèsesDesRésultats.map(synthèseDesRésultats => (
        [
          synthèseDesRésultats.chantier_id,
          {
            id: synthèseDesRésultats.id,
            contenu: synthèseDesRésultats.commentaire ?? '',
            date: synthèseDesRésultats.date_commentaire?.toISOString() ?? '',
            auteur: synthèseDesRésultats.auteur_id ? `${synthèseDesRésultats.auteur_prenom} ${synthèseDesRésultats.auteur_nom}` : 'Auteur Inconnu',
            météo: synthèseDesRésultats.meteo as Météo ?? 'NON_RENSEIGNEE',
          },
        ]
      )),
    );
  }
}
