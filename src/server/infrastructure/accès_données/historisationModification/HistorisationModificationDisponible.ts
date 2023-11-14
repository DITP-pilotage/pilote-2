import {
  convertirModel as convertirEnRawMetadataParametrageIndicateurModel,
} from '@/server/parametrage-indicateur/infrastructure/adapters/PrismaMetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export type HistorisationModificationDisponible = {
  'metadata_indicateurs': MetadataParametrageIndicateur
  'chantier': Chantier
};
export const tableConversionModification: { [key in keyof HistorisationModificationDisponible]: (obj: HistorisationModificationDisponible[key]) => any } = {
  metadata_indicateurs: convertirEnRawMetadataParametrageIndicateurModel,
  chantier: (chantier: Chantier) => chantier,
};
