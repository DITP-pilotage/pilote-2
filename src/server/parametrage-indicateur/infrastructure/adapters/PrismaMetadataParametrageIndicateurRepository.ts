/*
Cette classe ne possède pas encore de test car la récupération/création des données de la table raw_data.metadata_indicateur se fait par dbt
On ne peut donc pas utiliser la creation de table par migration prisma 
 */


import { Prisma, PrismaClient } from '@prisma/client';
import Logger from '@/server/infrastructure/logger';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';

interface RawMetadataParametrageIndicateurModel {
  indic_id: string,
  vi_dept_from: string,
  vi_dept_op: string,
  va_dept_from: string,
  va_dept_op: string,
  vc_dept_from: string,
  vc_dept_op: string,
  vi_reg_from: string,
  vi_reg_op: string,
  va_reg_from: string,
  va_reg_op: string,
  vc_reg_from: string,
  vc_reg_op: string,
  vi_nat_from: string,
  vi_nat_op: string,
  va_nat_from: string,
  va_nat_op: string,
  vc_nat_from: string,
  vc_nat_op: string,
  param_vaca_decumul_from: string,
  param_vaca_partition_date: string,
  param_vaca_op: string,
  param_vacg_decumul_from: string,
  param_vacg_partition_date: string,
  param_vacg_op: string,
  poids_pourcent_dept: number,
  poids_pourcent_reg: number,
  poids_pourcent_nat: number,
  tendance: string,
  indic_parent_indic: string,
  indic_parent_ch: string,
  indic_nom: string,
  indic_nom_baro: string,
  indic_descr: string,
  indic_descr_baro: string,
  indic_is_perseverant: boolean,
  indic_is_phare: boolean,
  indic_is_baro: boolean,
  indic_type: string,
  indic_source: string,
  indic_source_url: string,
  indic_methode_calcul: string,
  indic_unite: string,
  indic_hidden_pilote: string,
  indic_schema: string,
  ch_nom: string,
}

const makeStrSafer = (str: string): string => {
  return (str || '').replaceAll('\'', '’');
};

function convertirEnMetadataParametrageIndicateur(rawMetadataParametrageIndicateur: RawMetadataParametrageIndicateurModel): MetadataParametrageIndicateur {
  return MetadataParametrageIndicateur.creerMetadataParametrageIndicateur({
    indicId: rawMetadataParametrageIndicateur.indic_id,
    viDeptFrom: rawMetadataParametrageIndicateur.vi_dept_from,
    viDeptOp: rawMetadataParametrageIndicateur.vi_dept_op,
    vaDeptFrom: rawMetadataParametrageIndicateur.va_dept_from,
    vaDeptOp: rawMetadataParametrageIndicateur.va_dept_op,
    vcDeptFrom: rawMetadataParametrageIndicateur.vc_dept_from,
    vcDeptOp: rawMetadataParametrageIndicateur.vc_dept_op,
    viRegFrom: rawMetadataParametrageIndicateur.vi_reg_from,
    viRegOp: rawMetadataParametrageIndicateur.vi_reg_op,
    vaRegFrom: rawMetadataParametrageIndicateur.va_reg_from,
    vaRegOp: rawMetadataParametrageIndicateur.va_reg_op,
    vcRegFrom: rawMetadataParametrageIndicateur.vc_reg_from,
    vcRegOp: rawMetadataParametrageIndicateur.vc_reg_op,
    viNatFrom: rawMetadataParametrageIndicateur.vi_nat_from,
    viNatOp: rawMetadataParametrageIndicateur.vi_nat_op,
    vaNatFrom: rawMetadataParametrageIndicateur.va_nat_from,
    vaNatOp: rawMetadataParametrageIndicateur.va_nat_op,
    vcNatFrom: rawMetadataParametrageIndicateur.vc_nat_from,
    vcNatOp: rawMetadataParametrageIndicateur.vc_nat_op,
    paramVacaDecumulFrom: rawMetadataParametrageIndicateur.param_vaca_decumul_from,
    paramVacaPartitionDate: rawMetadataParametrageIndicateur.param_vaca_partition_date,
    paramVacaOp: rawMetadataParametrageIndicateur.param_vaca_op,
    paramVacgDecumulFrom: rawMetadataParametrageIndicateur.param_vacg_decumul_from,
    paramVacgPartitionDate: rawMetadataParametrageIndicateur.param_vacg_partition_date,
    paramVacgOp: rawMetadataParametrageIndicateur.param_vacg_op,
    poidsPourcentDept: rawMetadataParametrageIndicateur.poids_pourcent_dept,
    poidsPourcentReg: rawMetadataParametrageIndicateur.poids_pourcent_reg,
    poidsPourcentNat: rawMetadataParametrageIndicateur.poids_pourcent_nat,
    tendance: rawMetadataParametrageIndicateur.tendance,
    indicParentIndic: rawMetadataParametrageIndicateur.indic_parent_indic,
    indicParentCh: rawMetadataParametrageIndicateur.indic_parent_ch,
    indicNom: rawMetadataParametrageIndicateur.indic_nom,
    indicNomBaro: rawMetadataParametrageIndicateur.indic_nom_baro,
    indicDescr: rawMetadataParametrageIndicateur.indic_descr,
    indicDescrBaro: rawMetadataParametrageIndicateur.indic_descr_baro,
    indicIsPerseverant: rawMetadataParametrageIndicateur.indic_is_perseverant,
    indicIsPhare: rawMetadataParametrageIndicateur.indic_is_phare,
    indicIsBaro: rawMetadataParametrageIndicateur.indic_is_baro,
    indicType: rawMetadataParametrageIndicateur.indic_type,
    indicSource: rawMetadataParametrageIndicateur.indic_source,
    indicSourceUrl: rawMetadataParametrageIndicateur.indic_source_url,
    indicMethodeCalcul: rawMetadataParametrageIndicateur.indic_methode_calcul,
    indicUnite: rawMetadataParametrageIndicateur.indic_unite,
    indicHiddenPilote: rawMetadataParametrageIndicateur.indic_hidden_pilote,
    indicSchema: rawMetadataParametrageIndicateur.indic_schema,
    chantierNom: rawMetadataParametrageIndicateur.ch_nom,
  });
}

export class PrismaMetadataParametrageIndicateurRepository implements MetadataParametrageIndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async recupererListeMetadataParametrageIndicateurParChantierIds(chantierIds: string[]): Promise<MetadataParametrageIndicateur[]> {
    try {
      let query = 'SELECT mi.*, mpi.*, mc.ch_nom FROM raw_data.metadata_parametrage_indicateurs mpi ' +
                'LEFT JOIN raw_data.metadata_indicateurs mi ON mpi.indic_id = mi.indic_id ' +
                'LEFT JOIN raw_data.metadata_chantiers mc on mi.indic_parent_ch = mc.chantier_id';
      if (chantierIds.length > 0) {
        const listeStringChantierId = chantierIds.map(i => `'${i}'`).join(',');
        query = `${query} WHERE mi.indic_parent_ch IN (${listeStringChantierId})`;
      }
      const listeRawMetadataParametrageIndicateur = await this.prismaClient.$queryRaw<RawMetadataParametrageIndicateurModel[]>`${Prisma.raw(query)}`;

      if (listeRawMetadataParametrageIndicateur.length === 0) {
        return [];
      }

      return listeRawMetadataParametrageIndicateur.map(convertirEnMetadataParametrageIndicateur);
    } catch (error: unknown) {
      Logger.error(error);
      return [];
    }
  }

  async recupererMetadataParametrageIndicateurParIndicId(indicId: string): Promise<MetadataParametrageIndicateur> {
    try {
      let query = `SELECT *
                         FROM raw_data.metadata_parametrage_indicateurs mpi
                                  LEFT JOIN raw_data.metadata_indicateurs mi ON mpi.indic_id = mi.indic_id
                                  LEFT JOIN raw_data.metadata_chantiers mc ON mi.indic_parent_ch = mc.chantier_id
                         WHERE mpi.indic_id LIKE '${indicId}'
            `;
      const listeRawMetadataParametrageIndicateur = await this.prismaClient.$queryRaw<RawMetadataParametrageIndicateurModel[]>`${Prisma.raw(query)}`;

      if (listeRawMetadataParametrageIndicateur.length === 0) {
        throw new Error('invalid indic_id');
      }

      return convertirEnMetadataParametrageIndicateur(listeRawMetadataParametrageIndicateur[0]);
    } catch (error: unknown) {
      Logger.error(error);
      throw new Error((error as Error).message);
    }
  }


  async modifier(inputs: MetadataParametrageIndicateurForm): Promise<MetadataParametrageIndicateur> {

    const queryIndicateur = `UPDATE raw_data.metadata_indicateurs
                                 SET indic_parent_indic   = '${inputs.indicParentIndic}',
                                     indic_parent_ch   = '${inputs.indicParentCh}',
                                     indic_nom            = '${makeStrSafer(inputs.indicNom)}',
                                     indic_nom_baro       = '${makeStrSafer(inputs.indicNomBaro)}',
                                     indic_descr          = '${makeStrSafer(inputs.indicDescr)}',
                                     indic_descr_baro     = '${makeStrSafer(inputs.indicDescrBaro)}',
                                     indic_is_perseverant = ${inputs.indicIsPerseverant},
                                     indic_is_phare       = ${inputs.indicIsPhare},
                                     indic_is_baro        = ${inputs.indicIsBaro},
                                     indic_type           = '${makeStrSafer(inputs.indicType)}',
                                     indic_source         = '${makeStrSafer(inputs.indicSource)}',
                                     indic_source_url     = '${makeStrSafer(inputs.indicSourceUrl)}',
                                     indic_methode_calcul = '${makeStrSafer(inputs.indicMethodeCalcul)}',
                                     indic_unite          = '${makeStrSafer(inputs.indicUnite)}',
                                     indic_hidden_pilote  = ${inputs.indicHiddenPilote},
                                     indic_schema         = '${makeStrSafer(inputs.indicSchema)}'
                                 WHERE indic_id = '${inputs.indicId}'`;
    const queryMetadataIndicateur = `UPDATE raw_data.metadata_parametrage_indicateurs
                                         SET vi_dept_from              = '${makeStrSafer(inputs.viDeptFrom)}',
                                             vi_dept_op                = '${makeStrSafer(inputs.viDeptOp)}',
                                             va_dept_from              = '${makeStrSafer(inputs.vaDeptFrom)}',
                                             va_dept_op                = '${makeStrSafer(inputs.vaDeptOp)}',
                                             vc_dept_from              = '${makeStrSafer(inputs.vcDeptFrom)}',
                                             vc_dept_op                = '${makeStrSafer(inputs.vcDeptOp)}',
                                             vi_reg_from               = '${makeStrSafer(inputs.viRegFrom)}',
                                             vi_reg_op                 = '${makeStrSafer(inputs.viRegOp)}',
                                             va_reg_from               = '${makeStrSafer(inputs.vaRegFrom)}',
                                             va_reg_op                 = '${makeStrSafer(inputs.vaRegOp)}',
                                             vc_reg_from               = '${makeStrSafer(inputs.vcRegFrom)}',
                                             vc_reg_op                 = '${makeStrSafer(inputs.vcRegOp)}',
                                             vi_nat_from               = '${makeStrSafer(inputs.viNatFrom)}',
                                             vi_nat_op                 = '${makeStrSafer(inputs.viNatOp)}',
                                             va_nat_from               = '${makeStrSafer(inputs.vaNatFrom)}',
                                             va_nat_op                 = '${makeStrSafer(inputs.vaNatOp)}',
                                             vc_nat_from               = '${makeStrSafer(inputs.vcNatFrom)}',
                                             vc_nat_op                 = '${makeStrSafer(inputs.vcNatOp)}',
                                             param_vaca_decumul_from   = '${makeStrSafer(inputs.paramVacaDecumulFrom)}',
                                             param_vaca_partition_date = '${makeStrSafer(inputs.paramVacaPartitionDate)}',
                                             param_vaca_op             = '${makeStrSafer(inputs.paramVacaOp)}',
                                             param_vacg_decumul_from   = '${makeStrSafer(inputs.paramVacgDecumulFrom)}',
                                             param_vacg_partition_date = '${makeStrSafer(inputs.paramVacgPartitionDate)}',
                                             param_vacg_op             = '${makeStrSafer(inputs.paramVacgOp)}',
                                             poids_pourcent_dept       = '${inputs.poidsPourcentDept}',
                                             poids_pourcent_reg        = '${inputs.poidsPourcentReg}',
                                             poids_pourcent_nat        = '${inputs.poidsPourcentNat}',
                                             tendance                  = '${makeStrSafer(inputs.tendance)}'
                                         WHERE indic_id = '${inputs.indicId}'`;


    await this.prismaClient.$transaction([
      this.prismaClient.$queryRaw`${Prisma.raw(queryIndicateur)}`,
      this.prismaClient.$queryRaw`${Prisma.raw(queryMetadataIndicateur)}`,
    ]);

    return this.recupererMetadataParametrageIndicateurParIndicId(inputs.indicId);
  }

  async creer(inputs: MetadataParametrageIndicateurForm): Promise<MetadataParametrageIndicateur> {

    const queryIndicateur = `INSERT INTO raw_data.metadata_indicateurs (indic_id,
                                                                            indic_parent_indic,
                                                                            indic_parent_ch,
                                                                            indic_nom,
                                                                            indic_nom_baro,
                                                                            indic_descr,
                                                                            indic_descr_baro,
                                                                            indic_is_perseverant,
                                                                            indic_is_phare,
                                                                            indic_is_baro,
                                                                            indic_type,
                                                                            indic_source,
                                                                            indic_source_url,
                                                                            indic_methode_calcul,
                                                                            indic_unite,
                                                                            indic_hidden_pilote,
                                                                            indic_schema)
                                 VALUES ('${inputs.indicId}',
                                         '${inputs.indicParentIndic}',
                                         '${inputs.indicParentCh}',
                                         '${makeStrSafer(inputs.indicNom)}',
                                         '${makeStrSafer(inputs.indicNomBaro)}',
                                         '${makeStrSafer(inputs.indicDescr)}',
                                         '${makeStrSafer(inputs.indicDescrBaro)}',
                                         ${inputs.indicIsPerseverant},
                                         ${inputs.indicIsPhare},
                                         ${inputs.indicIsBaro},
                                         '${makeStrSafer(inputs.indicType)}',
                                         '${makeStrSafer(inputs.indicSource)}',
                                         '${makeStrSafer(inputs.indicSourceUrl)}',
                                         '${makeStrSafer(inputs.indicMethodeCalcul)}',
                                         '${makeStrSafer(inputs.indicUnite)}',
                                         ${inputs.indicHiddenPilote},
                                         '${makeStrSafer(inputs.indicSchema)}')`;
    const queryMetadataIndicateur = `INSERT INTO raw_data.metadata_parametrage_indicateurs (indic_id,
                                                                                                vi_dept_from,
                                                                                                vi_dept_op,
                                                                                                va_dept_from,
                                                                                                va_dept_op,
                                                                                                vc_dept_from,
                                                                                                vc_dept_op,
                                                                                                vi_reg_from,
                                                                                                vi_reg_op,
                                                                                                va_reg_from,
                                                                                                va_reg_op,
                                                                                                vc_reg_from,
                                                                                                vc_reg_op,
                                                                                                vi_nat_from,
                                                                                                vi_nat_op,
                                                                                                va_nat_from,
                                                                                                va_nat_op,
                                                                                                vc_nat_from,
                                                                                                vc_nat_op,
                                                                                                param_vaca_decumul_from,
                                                                                                param_vaca_partition_date,
                                                                                                param_vaca_op,
                                                                                                param_vacg_decumul_from,
                                                                                                param_vacg_partition_date,
                                                                                                param_vacg_op,
                                                                                                poids_pourcent_dept,
                                                                                                poids_pourcent_reg,
                                                                                                poids_pourcent_nat,
                                                                                                tendance)
                                         VALUES ('${inputs.indicId}',
                                                 '${makeStrSafer(inputs.viDeptFrom)}', 
                                                 '${makeStrSafer(inputs.viDeptOp)}', 
                                                 '${makeStrSafer(inputs.vaDeptFrom)}',
                                                 '${makeStrSafer(inputs.vaDeptOp)}', 
                                                 '${makeStrSafer(inputs.vcDeptFrom)}', 
                                                 '${makeStrSafer(inputs.vcDeptOp)}',
                                                 '${makeStrSafer(inputs.viRegFrom)}', 
                                                 '${makeStrSafer(inputs.viRegOp)}',
                                                 '${makeStrSafer(inputs.vaRegFrom)}', 
                                                 '${makeStrSafer(inputs.vaRegOp)}',
                                                 '${makeStrSafer(inputs.vcRegFrom)}', 
                                                 '${makeStrSafer(inputs.vcRegOp)}',
                                                 '${makeStrSafer(inputs.viNatFrom)}', 
                                                 '${makeStrSafer(inputs.viNatOp)}',
                                                 '${makeStrSafer(inputs.vaNatFrom)}', 
                                                 '${makeStrSafer(inputs.vaNatOp)}',
                                                 '${makeStrSafer(inputs.vcNatFrom)}', 
                                                 '${makeStrSafer(inputs.vcNatOp)}',
                                                 '${makeStrSafer(inputs.paramVacaDecumulFrom)}',
                                                 '${makeStrSafer(inputs.paramVacaPartitionDate)}',
                                                 '${makeStrSafer(inputs.paramVacaOp)}',
                                                 '${makeStrSafer(inputs.paramVacgDecumulFrom)}',
                                                 '${makeStrSafer(inputs.paramVacgPartitionDate)}',
                                                 '${makeStrSafer(inputs.paramVacgOp)}', 
                                                 '${inputs.poidsPourcentDept}',
                                                 '${inputs.poidsPourcentReg}', 
                                                 '${inputs.poidsPourcentNat}',
                                                 '${makeStrSafer(inputs.tendance)}')`;


    await this.prismaClient.$transaction([
      this.prismaClient.$queryRaw`${Prisma.raw(queryIndicateur)}`,
      this.prismaClient.$queryRaw`${Prisma.raw(queryMetadataIndicateur)}`,
    ]);

    return this.recupererMetadataParametrageIndicateurParIndicId(inputs.indicId);
  }
}
