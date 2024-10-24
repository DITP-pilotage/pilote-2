import Chantier from '@/server/domain/chantier/Chantier.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import {
  convertirEnModel as convertirEnUtilisateurModel,
} from '@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository';
import {
  convertirEnHistorisationMetadataParametrageIndicateurModel,
} from '@/server/domain/historisationModification/ClassConversion/HistorisationMetadataParametrageIndicateur';
import {
  convertirEnHistorisationMetadataIndicateurModel,
} from '@/server/domain/historisationModification/ClassConversion/HistorisationMetadataIndicateur';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import {
  convertirEnHistorisationMetadataIndicateurComplementaireModel,
} from '@/server/domain/historisationModification/ClassConversion/HistorisationMetadataIndicateurComplementaire';

export type HistorisationModificationDisponible = {
  'metadata_indicateurs': MetadataParametrageIndicateur
  'metadata_parametrages_indicateurs': MetadataParametrageIndicateur
  'metadata_indicateurs_complementaire': MetadataParametrageIndicateur
  'chantier': Chantier
  'utilisateur': Utilisateur
};
export const tableConversionModification: { [key in keyof HistorisationModificationDisponible]: (obj: any) => any } = {
  metadata_indicateurs: convertirEnHistorisationMetadataIndicateurModel,
  metadata_parametrages_indicateurs: convertirEnHistorisationMetadataParametrageIndicateurModel,
  metadata_indicateurs_complementaire: convertirEnHistorisationMetadataIndicateurComplementaireModel,
  chantier: (chantier: Chantier) => chantier,
  utilisateur: convertirEnUtilisateurModel,
};
export const tableRecuperationId: { [key in keyof HistorisationModificationDisponible]: (obj: any) => string } = {
  metadata_indicateurs: (obj: HistorisationModificationDisponible['metadata_indicateurs']) => obj.indicId,
  metadata_parametrages_indicateurs: (obj: HistorisationModificationDisponible['metadata_parametrages_indicateurs']) => obj.indicId,
  metadata_indicateurs_complementaire: (obj: HistorisationModificationDisponible['metadata_indicateurs_complementaire']) => obj.indicId,
  chantier: (obj: HistorisationModificationDisponible['chantier']) => obj?.id || 'identifiant inconnu',
  utilisateur: (obj: HistorisationModificationDisponible['utilisateur']) => obj?.id || 'identifiant inconnu',
};
