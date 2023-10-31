import { dependencies } from '@/server/infrastructure/Dependencies';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';
import {
  presenterEnMapInformationMetadataIndicateurContrat,
} from '@/server/app/contrats/InformationMetadataIndicateurContrat';

export default class InitialiserNouvelIndicateurUseCase {
  constructor(
    private readonly informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository = dependencies.getInformationMetadataIndicateurRepository(),
  ) {}

  async run(indicId: string): Promise<MetadataParametrageIndicateur> {
    const listeInformation = presenterEnMapInformationMetadataIndicateurContrat(await this.informationMetadataIndicateurRepository.récupererInformationMetadataIndicateur());

    return MetadataParametrageIndicateur.creerMetadataParametrageIndicateur({
      indicId,
      viDeptFrom: listeInformation.vi_dept_from.metaPiloteDefaultValue as string,
      viDeptOp: listeInformation.vi_dept_op.metaPiloteDefaultValue as string,
      vaDeptFrom: listeInformation.va_dept_from.metaPiloteDefaultValue as string,
      vaDeptOp: listeInformation.va_dept_op.metaPiloteDefaultValue as string,
      vcDeptFrom: listeInformation.vc_dept_from.metaPiloteDefaultValue as string,
      vcDeptOp: listeInformation.vc_dept_op.metaPiloteDefaultValue as string,
      viRegFrom: listeInformation.vi_reg_from.metaPiloteDefaultValue as string,
      viRegOp: listeInformation.vi_reg_op.metaPiloteDefaultValue as string,
      vaRegFrom: listeInformation.va_reg_from.metaPiloteDefaultValue as string,
      vaRegOp: listeInformation.va_reg_op.metaPiloteDefaultValue as string,
      vcRegFrom: listeInformation.vc_reg_from.metaPiloteDefaultValue as string,
      vcRegOp: listeInformation.vc_reg_op.metaPiloteDefaultValue as string,
      viNatFrom: listeInformation.vi_nat_from.metaPiloteDefaultValue as string,
      viNatOp: listeInformation.vi_nat_op.metaPiloteDefaultValue as string,
      vaNatFrom: listeInformation.va_nat_from.metaPiloteDefaultValue as string,
      vaNatOp: listeInformation.va_nat_op.metaPiloteDefaultValue as string,
      vcNatFrom: listeInformation.vc_nat_from.metaPiloteDefaultValue as string,
      vcNatOp: listeInformation.vc_nat_op.metaPiloteDefaultValue as string,
      paramVacaDecumulFrom: listeInformation.param_vaca_decumul_from.metaPiloteDefaultValue as string,
      paramVacaPartitionDate: listeInformation.param_vaca_partition_date.metaPiloteDefaultValue as string,
      paramVacaOp: listeInformation.param_vaca_op.metaPiloteDefaultValue as string,
      paramVacgDecumulFrom: listeInformation.param_vacg_decumul_from.metaPiloteDefaultValue as string,
      paramVacgPartitionDate: listeInformation.param_vacg_partition_date.metaPiloteDefaultValue as string,
      paramVacgOp: listeInformation.param_vacg_op.metaPiloteDefaultValue as string,
      poidsPourcentDept: listeInformation.poids_pourcent_dept.metaPiloteDefaultValue as number,
      poidsPourcentReg: listeInformation.poids_pourcent_reg.metaPiloteDefaultValue as number,
      poidsPourcentNat: listeInformation.poids_pourcent_nat.metaPiloteDefaultValue as number,
      tendance: listeInformation.tendance.metaPiloteDefaultValue as string,
      indicParentIndic: listeInformation.indic_parent_indic.metaPiloteDefaultValue as string,
      indicParentCh: listeInformation.indic_parent_ch.metaPiloteDefaultValue as string,
      indicNom: listeInformation.indic_nom.metaPiloteDefaultValue as string,
      indicNomBaro: listeInformation.indic_nom_baro.metaPiloteDefaultValue as string,
      indicDescr: listeInformation.indic_descr.metaPiloteDefaultValue as string,
      indicDescrBaro: listeInformation.indic_descr_baro.metaPiloteDefaultValue as string,
      indicIsPerseverant: listeInformation.indic_is_perseverant.metaPiloteDefaultValue as boolean,
      indicIsPhare: listeInformation.indic_is_phare.metaPiloteDefaultValue as boolean,
      indicIsBaro: listeInformation.indic_is_baro.metaPiloteDefaultValue as boolean,
      indicType: listeInformation.indic_type.metaPiloteDefaultValue as string,
      indicSource: listeInformation.indic_source.metaPiloteDefaultValue as string,
      indicSourceUrl: listeInformation.indic_source_url.metaPiloteDefaultValue as string,
      indicMethodeCalcul: listeInformation.indic_methode_calcul.metaPiloteDefaultValue as string,
      indicUnite: listeInformation.indic_unite.metaPiloteDefaultValue as string,
      indicHiddenPilote: listeInformation.indic_hidden_pilote.metaPiloteDefaultValue as string,
      indicSchema: listeInformation.indic_schema.metaPiloteDefaultValue as string,
      chantierNom: '',
    });
  }
}
