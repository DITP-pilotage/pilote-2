import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';

export interface MetadataParametrageIndicateurRepository {
  recupererListeMetadataParametrageIndicateurParChantierIds(chantierIds: string[]): Promise<MetadataParametrageIndicateur[]>;

  recupererMetadataParametrageIndicateurParIndicId(indicId: string): Promise<MetadataParametrageIndicateur>;

  modifier(inputs: MetadataParametrageIndicateurForm): Promise<MetadataParametrageIndicateur>;
}
