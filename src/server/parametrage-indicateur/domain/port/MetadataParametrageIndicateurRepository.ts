import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export interface MetadataParametrageIndicateurRepository {
  recupererListeMetadataParametrageIndicateurParChantierIds(chantierIds: string[]): Promise<MetadataParametrageIndicateur[]>;

  recupererMetadataParametrageIndicateurParIndicId(indicId: string): Promise<MetadataParametrageIndicateur>;

  modifier(inputs: MetadataParametrageIndicateur): Promise<MetadataParametrageIndicateur>;
  
  creer(inputs: MetadataParametrageIndicateur): Promise<MetadataParametrageIndicateur>;
}
