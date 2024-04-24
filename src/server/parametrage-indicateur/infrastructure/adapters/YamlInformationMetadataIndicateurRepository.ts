import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';
import { InformationMetadataIndicateur } from '@/server/parametrage-indicateur/domain/InformationMetadataIndicateur';
import { AcceptedValue } from '@/server/parametrage-indicateur/domain/AcceptedValue';
import data from '../../../../../data_management/data_factory/models/staging/import/sources.yml';

interface YamlAcceptedValue {

  order_id: number,
  value: string,
  name: string,
  desc: string
}

interface YamlColumn {
  name: string,
  data_type: 'text' | 'boolean',
  description: string,
  meta: {
    pilote_show: boolean,
    pilote_alias: string,
    pilote_edit_isEditable: boolean
    pilote_edit_regex: string
    pilote_edit_regexViolationMessage: string | null
    pilote_edit_boxType: 'text' | 'textarea' | 'boolean'
    pilote_edit_acceptedValues: string
    pilote_create_defaultValue: string | number | null | boolean
    pilote_create_mandatory: boolean
    pilote_disp_dispDesc: boolean
  }
}

interface YamlTable {
  columns: YamlColumn[]
}

interface YamlSource {
  name: string
  tables: YamlTable[]
}

export interface YamlResult {
  sources: YamlSource[]
}
const convertirEnInformationMetadataIndicateur = (yamlColumn: YamlColumn): InformationMetadataIndicateur   => {
  const acceptedValues: YamlAcceptedValue[] = (yamlColumn.meta.pilote_edit_acceptedValues && JSON.parse(yamlColumn.meta.pilote_edit_acceptedValues) as YamlAcceptedValue[]) || [];
  return InformationMetadataIndicateur.creerInformationMetadataIndicateur({
    name: yamlColumn.name,
    dataType: yamlColumn.data_type,
    description: yamlColumn.description,
    metaPiloteShow: yamlColumn.meta.pilote_show,
    metaPiloteAlias: yamlColumn.meta.pilote_alias,
    metaPiloteEditIsEditable: yamlColumn.meta.pilote_edit_isEditable,
    metaPiloteEditRegex: yamlColumn.meta.pilote_edit_regex,
    metaPiloteEditRegexViolationMessage: yamlColumn.meta.pilote_edit_regexViolationMessage,
    metaPiloteEditBoxType: yamlColumn.meta.pilote_edit_boxType,
    metaPiloteDefaultValue: yamlColumn.meta.pilote_create_defaultValue,
    metaPiloteMandatory: yamlColumn.meta.pilote_create_mandatory || false,
    metaPiloteDispDispDesc: yamlColumn.meta.pilote_disp_dispDesc || false,
    acceptedValues: acceptedValues.map(acceptedValue => (AcceptedValue.créerAcceptedValue({
      orderId: acceptedValue.order_id,
      value: acceptedValue.value,
      name: acceptedValue.name,
      desc: acceptedValue.desc,
    }))),
  });
};

export class YamlInformationMetadataIndicateurRepository implements InformationMetadataIndicateurRepository {
  // Le bon fonctionnement de la récupération est conditionné à un format correct du fichier yaml et notamment de la présence d'une source "parametrage_indicateur".
  // En cas de problème, vérifier le contenu du yaml.
  récupererInformationMetadataIndicateur(): InformationMetadataIndicateur[] {
    const result: YamlResult = data as YamlResult;
    return result.sources.find(source => source.name === 'parametrage_indicateurs')!.tables.flatMap(table => table.columns).filter(Boolean).map(convertirEnInformationMetadataIndicateur);
  }
}
