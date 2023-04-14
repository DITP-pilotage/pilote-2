import { PrismaClient, synthese_des_resultats } from '@prisma/client';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee, Territoires } from '@/server/domain/territoire/Territoire.interface';
import {
  DonnéesTerritoriales,
} from '@/server/domain/chantierDonnéesTerritoriales/chantierDonnéesTerritoriales.interface';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import ChantierDonnéesTerritorialesRepository from './ChantierDonnéesTerritorialesRepository.interface';

function créerDonnéesTerritoires(
  territoires: TerritoireGéographique[],
  avancementsTerritorials: Array<{ code_insee: string, taux_avancement: number | null }>,
  météosTerritoriales: Array<{ code_insee: string, meteo: string | null }>,
) {
  let donnéesTerritoires: Territoires = {};

  territoires.forEach(territoire => {
    const avancementTerritorial = avancementsTerritorials.find(c => c.code_insee === territoire.codeInsee);
    const météoTerritoriale = météosTerritoriales.find(s => s.code_insee === territoire.codeInsee);

    donnéesTerritoires[territoire.codeInsee] = {
      codeInsee: territoire.codeInsee,
      avancement: { annuel: null, global: avancementTerritorial?.taux_avancement ?? null },
      météo: météoTerritoriale?.meteo as Météo ?? 'NON_RENSEIGNEE',
    };
  });

  return donnéesTerritoires;
}

export default class ChantierDonnéesTerritorialesSQLRepository implements ChantierDonnéesTerritorialesRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupérerTousLesAvancementsDUnChantier(chantierId: string): Promise<Record<Maille, Record<CodeInsee, DonnéesTerritoriales>>> {
    const chantierRows = await this.prisma.chantier.findMany({
      where: {
        id: chantierId,
      },
    });

    type Row = Pick<synthese_des_resultats, 'maille' | 'code_insee' | 'meteo'>;

    const synthèseDesRésultatsRows = await this.prisma.$queryRaw<Row[]>`
      with meteos_les_plus_recentes as (
        select maille, code_insee, max(date_commentaire) as max_date
        from synthese_des_resultats
        where chantier_id = ${chantierId}
        group by maille, code_insee
      )
      select maille, code_insee, meteo
      from synthese_des_resultats as m
        inner join meteos_les_plus_recentes as m_recentes
          on m.maille = m_recentes.maille
            and m.code_insee = m_recentes.code_insee
            and m.date_commentaire = m_recentes.max_date
      where chantier_id = ${chantierId}
    `;

    const chantierMailleNationale = chantierRows.find(c => c.maille === 'NAT');
    const synthèseDesRésultatsMailleNationale = synthèseDesRésultatsRows.find(s => s.maille === 'NAT');

    return {
      nationale: {
        FR: {
          codeInsee: 'FR',
          avancement: {
            annuel: null,
            global: chantierMailleNationale?.taux_avancement ?? null,
          },
          météo: synthèseDesRésultatsMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
        },
      },
      régionale: créerDonnéesTerritoires(
        régions,
        chantierRows.filter(c => c.maille === 'REG'),
        synthèseDesRésultatsRows.filter(s => s.maille === 'REG'),
      ),
      départementale: créerDonnéesTerritoires(
        départements,
        chantierRows.filter(c => c.maille === 'DEPT'),
        synthèseDesRésultatsRows.filter(s => s.maille === 'DEPT'),
      ),
    };
  }
}
