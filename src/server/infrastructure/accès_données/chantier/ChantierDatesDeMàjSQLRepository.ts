import { Maille as MaillePrisma, Prisma, PrismaClient } from '@prisma/client';
import { CodeInsee, Territoire } from '@/server/domain/territoire/Territoire.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import Chantier, { ChantierDatesDeMiseÀJour } from '@/server/domain/chantier/Chantier.interface';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';

type RowsDatesDeMàjDesDonnées = Array<{
  chantier_id: string,
  territoire_code: string,
  date_donnees_qualitatives: Date,
}>;

export default class ChantierDatesDeMàjSQLRepository implements ChantierDatesDeMàjRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  async récupérerDatesDeMiseÀJour(chantierIds: string[], territoireCodes: string[]) {
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
    const prismaJoinMailleCodeInsee = ({ maille, codeInsee }: { maille: MaillePrisma, codeInsee: CodeInsee }) => Prisma.join([maille, codeInsee]);
    const séparateur = '),(';
    const préfixe = '(';
    const suffixe = ')';
    const prismaJoinTerritoires = Prisma.join(territoireCodes.map(t => prismaJoinMailleCodeInsee(territoireCodeVersMailleCodeInsee(t))), séparateur, préfixe, suffixe);

    return this.prisma.$queryRaw<RowsDatesDeMàjDesDonnées>`
      with chantiers_temp as (
        select id as chantier_id, maille, code_insee
        from chantier
        where id in (${Prisma.join(chantierIds)})
          and (maille, code_insee) in (
              values ${prismaJoinTerritoires}
            )
          ),
          dates_qualitatives as (
            (
              select chantier_id, maille, code_insee, MAX(date) as date
              from commentaire
              group by chantier_id, maille, code_insee
            )
            union
            (
              select chantier_id, maille, code_insee, MAX(GREATEST(date_meteo, date_commentaire)) as date
              from synthese_des_resultats
              group by chantier_id, maille, code_insee
            )
          )
      select
          chantiers_temp.chantier_id as chantier_id,
          CONCAT(chantiers_temp.maille, '-', chantiers_temp.code_insee) as territoire_code,
          MAX(d_quali.date) as date_donnees_qualitatives
      from chantiers_temp
          left join dates_qualitatives as d_quali
                    on chantiers_temp.chantier_id = d_quali.chantier_id and chantiers_temp.maille = d_quali.maille and chantiers_temp.code_insee = d_quali.code_insee
      group by chantiers_temp.chantier_id, territoire_code;
    `;
  }

  private construireLaRéponse(rows: Array<{
    chantier_id: string;
    territoire_code: string;
    date_donnees_qualitatives: Date
  }>) {
    let résultat: Record<Chantier['id'], Record<Territoire['code'], ChantierDatesDeMiseÀJour>> = {};

    for (const row of rows) {
      if (!résultat[row.chantier_id]) {
        résultat[row.chantier_id] = {};
      }
      résultat[row.chantier_id][row.territoire_code] = {
        dateDeMàjDonnéesQualitatives: row.date_donnees_qualitatives?.toISOString() ?? null,
      };
    }

    return résultat;
  }
}
