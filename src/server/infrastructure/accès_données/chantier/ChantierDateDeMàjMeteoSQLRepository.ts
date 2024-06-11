import { Prisma, PrismaClient } from '@prisma/client';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import Chantier, { ChantierDateMajMeteo } from '@/server/domain/chantier/Chantier.interface';
import ChantierDateDeMàjMeteoRepository from '@/server/domain/chantier/ChantierDateDeMàjMeteoRepository.interface';

type RowsDatesDeMàjDesDonnées = Array<(
  Prisma.PickArray<Prisma.Synthese_des_resultatsGroupByOutputType, ('chantier_id' | 'maille' | 'code_insee')[]> & {
    _max: {
      date_meteo: Date | null;
    }
  })>;

export default class ChantierDateDeMàjMeteoSQLRepository implements ChantierDateDeMàjMeteoRepository {
  constructor(private prismaClient: PrismaClient) {}
  
  async récupérerDateDeMiseÀJourMeteo(chantierIds: string[], territoireCodes: string[]) {
    const rows = await this.prismaClient.synthese_des_resultats.groupBy({
      where: {
        chantier_id: {
          in: chantierIds,
        },
        OR: territoireCodes.map(territoireCode => {
          const [maille, codeInsee] = territoireCode.split('-');
          return {
            maille: maille,
            code_insee: codeInsee,
          };
        }),
      },
      by: ['chantier_id', 'maille', 'code_insee'],
      _max: {
        date_meteo: true,
      },
    });

    return this.convertirEnMapDateDeMAJMeteoParChantierIdEtTerritoireCode(rows);
  }

  private convertirEnMapDateDeMAJMeteoParChantierIdEtTerritoireCode(rows: RowsDatesDeMàjDesDonnées) {
    return rows.reduce((acc, val) => {
      acc[val.chantier_id] = { ...acc[val.chantier_id], [`${val.maille}-${val.code_insee}`]: val._max.date_meteo?.toISOString() ?? null };
      return acc;
    }, {} as Record<Chantier['id'], Record<Territoire['code'], ChantierDateMajMeteo>>);
  }
}
