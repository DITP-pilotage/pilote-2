import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export interface HistorisationMetadataParametrageIndicateur {
  indic_id: string;

  vi_dept_from: string;

  vi_dept_op: string;

  va_dept_from: string;

  va_dept_op: string;

  vc_dept_from: string;

  vc_dept_op: string;

  vi_reg_from: string;

  vi_reg_op: string;

  va_reg_from: string;

  va_reg_op: string;

  vc_reg_from: string;

  vc_reg_op: string;

  vi_nat_from: string;

  vi_nat_op: string;

  va_nat_from: string;

  va_nat_op: string;

  vc_nat_from: string;

  vc_nat_op: string;

  param_vaca_decumul_from: string;

  param_vaca_partition_date: string;

  param_vaca_op: string;

  param_vacg_decumul_from: string;

  param_vacg_partition_date: string;

  param_vacg_op: string;

  poids_pourcent_dept_declaree: number;

  poids_pourcent_reg_declaree: number;

  poids_pourcent_nat_declaree: number;

  tendance: string;
}

export function convertirEnHistorisationMetadataParametrageIndicateurModel(metadataParametrageIndicateur: MetadataParametrageIndicateur): HistorisationMetadataParametrageIndicateur {
  return {
    indic_id: metadataParametrageIndicateur.indicId,
    vi_dept_from: metadataParametrageIndicateur.viDeptFrom,
    vi_dept_op: metadataParametrageIndicateur.viDeptOp,
    va_dept_from: metadataParametrageIndicateur.vaDeptFrom,
    va_dept_op: metadataParametrageIndicateur.vaDeptOp,
    vc_dept_from: metadataParametrageIndicateur.vcDeptFrom,
    vc_dept_op: metadataParametrageIndicateur.vcDeptOp,
    vi_reg_from: metadataParametrageIndicateur.viRegFrom,
    vi_reg_op: metadataParametrageIndicateur.viRegOp,
    va_reg_from: metadataParametrageIndicateur.vaRegFrom,
    va_reg_op: metadataParametrageIndicateur.vaRegOp,
    vc_reg_from: metadataParametrageIndicateur.vcRegFrom,
    vc_reg_op: metadataParametrageIndicateur.vcRegOp,
    vi_nat_from: metadataParametrageIndicateur.viNatFrom,
    vi_nat_op: metadataParametrageIndicateur.viNatOp,
    va_nat_from: metadataParametrageIndicateur.vaNatFrom,
    va_nat_op: metadataParametrageIndicateur.vaNatOp,
    vc_nat_from: metadataParametrageIndicateur.vcNatFrom,
    vc_nat_op: metadataParametrageIndicateur.vcNatOp,
    param_vaca_decumul_from: metadataParametrageIndicateur.paramVacaDecumulFrom,
    param_vaca_partition_date: metadataParametrageIndicateur.paramVacaPartitionDate,
    param_vaca_op: metadataParametrageIndicateur.paramVacaOp,
    param_vacg_decumul_from: metadataParametrageIndicateur.paramVacgDecumulFrom,
    param_vacg_partition_date: metadataParametrageIndicateur.paramVacgPartitionDate,
    param_vacg_op: metadataParametrageIndicateur.paramVacgOp,
    poids_pourcent_dept_declaree: metadataParametrageIndicateur.poidsPourcentDept,
    poids_pourcent_reg_declaree: metadataParametrageIndicateur.poidsPourcentReg,
    poids_pourcent_nat_declaree: metadataParametrageIndicateur.poidsPourcentNat,
    tendance: metadataParametrageIndicateur.tendance,
  };
}
