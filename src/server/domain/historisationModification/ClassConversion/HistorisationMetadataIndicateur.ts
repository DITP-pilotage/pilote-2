import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export interface HistorisationMetadataIndicateur {
  indic_id: string;

  indic_parent_indic: string;

  indic_parent_ch: string;

  indic_nom: string;

  indic_nom_baro: string;

  indic_descr: string;

  indic_descr_baro: string;

  indic_is_perseverant: boolean;

  indic_is_phare: boolean;

  indic_is_baro: boolean;

  indic_type: string;

  indic_source: string;

  indic_source_url: string;

  indic_methode_calcul: string;

  indic_unite: string;

  indic_hidden_pilote: boolean;

  indic_schema: string;
}

export function convertirEnHistorisationMetadataIndicateurModel(metadataParametrageIndicateur: MetadataParametrageIndicateur): HistorisationMetadataIndicateur {
  return {
    indic_id: metadataParametrageIndicateur.indicId,
    indic_parent_indic: metadataParametrageIndicateur.indicParentIndic,
    indic_parent_ch: metadataParametrageIndicateur.indicParentCh,
    indic_nom: metadataParametrageIndicateur.indicNom,
    indic_nom_baro: metadataParametrageIndicateur.indicNomBaro,
    indic_descr: metadataParametrageIndicateur.indicDescr,
    indic_descr_baro: metadataParametrageIndicateur.indicDescrBaro,
    indic_is_perseverant: metadataParametrageIndicateur.indicIsPerseverant,
    indic_is_phare: metadataParametrageIndicateur.indicIsPhare,
    indic_is_baro: metadataParametrageIndicateur.indicIsBaro,
    indic_type: metadataParametrageIndicateur.indicType,
    indic_source: metadataParametrageIndicateur.indicSource,
    indic_source_url: metadataParametrageIndicateur.indicSourceUrl,
    indic_methode_calcul: metadataParametrageIndicateur.indicMethodeCalcul,
    indic_unite: metadataParametrageIndicateur.indicUnite,
    indic_hidden_pilote: metadataParametrageIndicateur.indicHiddenPilote,
    indic_schema: metadataParametrageIndicateur.indicSchema,
  };
}
