import { InformationMetadataIndicateur } from '@/server/parametrage-indicateur/domain/InformationMetadataIndicateur';

interface AcceptedValueContrat {
  ordre: number
  libellé: string
  valeur: string
  description: string
}

export interface InformationMetadataIndicateurContrat {
  name: string;

  dataType: 'text' | 'boolean';

  description: string;

  metaPiloteShow: boolean;

  metaPiloteAlias: string;

  metaPiloteEditIsEditable: boolean;

  metaPiloteEditRegex: string;

  metaPiloteEditRegexViolationMessage: string;

  metaPiloteEditBoxType: 'text' | 'textarea' | 'boolean';

  metaPiloteDefaultValue: string | number | null | boolean;

  acceptedValues: AcceptedValueContrat[];
}

type AvailableInformationMetadataIndicateur = 'indic_id'
| 'indic_parent_indic'
| 'indic_parent_ch'
| 'indic_nom'
| 'indic_nom_baro'
| 'indic_descr'
| 'indic_descr_baro'
| 'indic_is_perseverant'
| 'indic_is_phare'
| 'indic_is_baro'
| 'indic_type'
| 'indic_source' 
| 'indic_source_url'
| 'indic_methode_calcul'
| 'indic_unite'
| 'indic_hidden_pilote'
| 'indic_schema'
| 'zg_applicable'
| 'vi_dept_from'
| 'vi_dept_op'
| 'va_dept_from'
| 'va_dept_op'
| 'vc_dept_from'
| 'vc_dept_op'
| 'vi_reg_from'
| 'vi_reg_op'
| 'va_reg_from'
| 'va_reg_op'
| 'vc_reg_from'
| 'vc_reg_op'
| 'vi_nat_from'
| 'vi_nat_op'
| 'va_nat_from'
| 'va_nat_op'
| 'vc_nat_from'
| 'vc_nat_op'
| 'param_vaca_decumul_from'
| 'param_vacg_decumul_from'
| 'param_vaca_partition_date'
| 'param_vacg_partition_date'
| 'param_vaca_op'
| 'param_vacg_op'
| 'poids_pourcent_dept'
| 'poids_pourcent_reg'
| 'poids_pourcent_nat'
| 'tendance';

export type MapInformationMetadataIndicateurContrat = {
  [key in AvailableInformationMetadataIndicateur]: InformationMetadataIndicateurContrat;
};

export const presenterEnInformationMetadataIndicateurContrat = (informationMetadataIndicateur: InformationMetadataIndicateur): InformationMetadataIndicateurContrat => {
  return {
    name: informationMetadataIndicateur.name || '',
    dataType: informationMetadataIndicateur.dataType  || '',
    description: informationMetadataIndicateur.description  || '',
    metaPiloteShow: informationMetadataIndicateur.metaPiloteShow  || false,
    metaPiloteAlias: informationMetadataIndicateur.metaPiloteAlias  || '',
    metaPiloteEditIsEditable: informationMetadataIndicateur.metaPiloteEditIsEditable  || false,
    metaPiloteEditRegex: informationMetadataIndicateur.metaPiloteEditRegex  || '',
    metaPiloteEditRegexViolationMessage: informationMetadataIndicateur.metaPiloteEditRegexViolationMessage  || '',
    metaPiloteEditBoxType: informationMetadataIndicateur.metaPiloteEditBoxType  || '',
    metaPiloteDefaultValue: informationMetadataIndicateur.metaPiloteDefaultValue,
    acceptedValues: informationMetadataIndicateur.acceptedValues.map(acceptedValue => ({
      ordre: acceptedValue.orderId,
      libellé: acceptedValue.name,
      valeur: acceptedValue.value,
      description: acceptedValue.desc,
    })),
  };
};

export const presenterEnMapInformationMetadataIndicateurContrat = (listeInformationMetadataIndicateur: InformationMetadataIndicateur[]): MapInformationMetadataIndicateurContrat => {
  // eslint-disable-next-line unicorn/no-array-reduce
  return listeInformationMetadataIndicateur.reduce((obj, valeur) => {
    obj[valeur.name as AvailableInformationMetadataIndicateur] = presenterEnInformationMetadataIndicateurContrat(valeur);
    return obj;
  }, {} as MapInformationMetadataIndicateurContrat);
};
