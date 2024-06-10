import { Prisma, PrismaClient } from '@prisma/client';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import Chantier, { ChantierDateMajMeteo } from '@/server/domain/chantier/Chantier.interface';
import ChantierDateDeMàjMeteoRepository from '@/server/domain/chantier/ChantierDateDeMàjMeteoRepository.interface';

type RowsDatesDeMàjDesDonnées = Array<(
  Prisma.PickArray<Prisma.Synthese_des_resultatsGroupByOutputType, ('chantier_id' | 'maille' | 'code_insee')[]> & 
  {
    _max: {
      date_meteo: Date | null;
    }
  })>;

export default class ChantierDateDeMàjMeteoSQLRepository implements ChantierDateDeMàjMeteoRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  async récupérerDateDeMiseÀJourMeteo(chantierIds: string[], territoireCodes: string[]) {
    if (this.estRequêteVide(chantierIds, territoireCodes)) {
      return {};
    }

    const rows = await this.requêterChantiersDatesDeMàj(chantierIds, territoireCodes);

    return this.construireLaRéponse(rows);
  }

  private estRequêteVide(chantierIds: string[], territoireCodes: string[]) {
    return chantierIds.length === 0 || territoireCodes.length === 0;
  }

  private async requêterChantiersDatesDeMàj(chantierIds: string[], territoireCodes: string[]) {
    
    const maillesEtCodeInsee = territoireCodes.map(territoireCode => territoireCodeVersMailleCodeInsee(territoireCode));

    return this.prisma.synthese_des_resultats.groupBy({
      where: {
        chantier_id: {
          in: chantierIds,
        },
        OR: maillesEtCodeInsee.map(paire => ({
          maille: paire.maille,
          code_insee: paire.codeInsee,
        })),
      },
      by: ['chantier_id', 'maille', 'code_insee'],
      _max: {
        date_meteo: true,
      },
    });
  }

  private construireLaRéponse(rows: RowsDatesDeMàjDesDonnées) {
    let résultat: Record<Chantier['id'], Record<Territoire['code'], ChantierDateMajMeteo>> = {};

    for (const row of rows) {
      if (!résultat[row.chantier_id]) {
        résultat[row.chantier_id] = {};
      }
      résultat[row.chantier_id][`${row.maille}-${row.code_insee}`] = row._max.date_meteo?.toISOString() ?? null;
    }

    return résultat;
  }
}
