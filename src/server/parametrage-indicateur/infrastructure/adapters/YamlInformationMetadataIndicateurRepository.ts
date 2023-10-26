import { parse } from 'yaml';
import fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';
import { InformationMetadataIndicateur } from '@/server/parametrage-indicateur/domain/InformationMetadataIndicateur';
import { AcceptedValue } from '@/server/parametrage-indicateur/domain/AcceptedValue';

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
  }
}

interface YamlModel {
  columns: YamlColumn[]
}

interface YamlResult {
  models: YamlModel[]
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
    acceptedValues: acceptedValues.map(acceptedValue => (AcceptedValue.créerAcceptedValue({
      orderId: acceptedValue.order_id,
      value: acceptedValue.value,
      name: acceptedValue.name,
      desc: acceptedValue.desc,
    }))),
  });
};

export class YamlInformationMetadataIndicateurRepository implements InformationMetadataIndicateurRepository {
  récupererInformationMetadataIndicateur(): Promise<InformationMetadataIndicateur[]> {
    const pathToYamlInformationMetadataIndicateur = `${path.dirname(url.fileURLToPath(import.meta.url))}/../../../../../data_management/data_factory/models/raw/ppg_metadata/schema.yml`;
    const file = fs.readFileSync(pathToYamlInformationMetadataIndicateur, 'utf8');
    const result: YamlResult = parse(file);
    return Promise.resolve([...result.models[0].columns, ...result.models[1].columns].map(convertirEnInformationMetadataIndicateur));
  }
}
