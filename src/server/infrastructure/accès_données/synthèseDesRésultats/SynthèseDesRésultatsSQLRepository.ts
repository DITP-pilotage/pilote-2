import { synthese_des_resultats, PrismaClient } from '@prisma/client';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import régions from '@/client/constants/régions.json';
import départements from '@/client/constants/départements.json';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';

export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, id: string, contenu: string, auteur: string, météo: Météo, date: Date): Promise<SynthèseDesRésultats> {
    const synthèseDesRésultats =  await this.prisma.synthese_des_resultats.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        commentaire: contenu,
        meteo: météo,
        date_commentaire: date,
        date_meteo: date,
        auteur: auteur,
      } });
    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  private mapperVersDomaine(synthèse: synthese_des_resultats | null): SynthèseDesRésultats {
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

    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  async récupérerLesPlusRécentesPourTousLesTerritoires(chantierId: string) {
    const synthèsesDesRésultats = await this.prisma.$queryRaw<synthese_des_resultats[]>`
      with meteos_les_plus_recentes as (
        select maille, code_insee, max(date_commentaire) as max_date
        from synthese_des_resultats
        where chantier_id = ${chantierId}
        group by maille, code_insee
      )
      select s.*
      from synthese_des_resultats as s
        inner join meteos_les_plus_recentes as m_recentes
          on s.maille = m_recentes.maille
            and s.code_insee = m_recentes.code_insee
            and s.date_commentaire = m_recentes.max_date
      where chantier_id = ${chantierId}
    `;

    const synthèsesDesRésultatsMailleNationale = synthèsesDesRésultats.find(c => c.maille === 'NAT') ?? null;

    return {
      nationale: {
        FR: this.mapperVersDomaine(synthèsesDesRésultatsMailleNationale),
      },
      régionale: this._territorialiser(
        régions,
        synthèsesDesRésultats.filter(c => c.maille === 'REG'),
      ),
      départementale: this._territorialiser(
        départements,
        synthèsesDesRésultats.filter(c => c.maille === 'DEPT'),
      ),
    };
  }

  async récupérerHistorique(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats[]> {
    const synthèsesDesRésultats = await this.prisma.synthese_des_resultats.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
      orderBy: { date_commentaire : 'desc' },
    });

    return synthèsesDesRésultats
      .map((synthèse: synthese_des_resultats) => this.mapperVersDomaine(synthèse))
      .filter((synthèse: SynthèseDesRésultats) => synthèse !== null);
  }

  private _territorialiser(
    territoires: TerritoireGéographique[],
    synthèsesDesRésultatsTerritoriales: synthese_des_resultats[],
  ) {
    let donnéesTerritoires: Record<CodeInsee, SynthèseDesRésultats> = {};

    territoires.forEach(territoire => {
      const synthèseTerritoriale = synthèsesDesRésultatsTerritoriales.find(c => c.code_insee === territoire.codeInsee) ?? null;

      donnéesTerritoires[territoire.codeInsee] = this.mapperVersDomaine(synthèseTerritoriale);
    });

    return donnéesTerritoires;
  }
}
