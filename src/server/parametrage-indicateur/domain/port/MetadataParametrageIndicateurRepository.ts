import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import { ImportMetadataIndicateur } from '@/server/parametrage-indicateur/domain/ImportMetadataIndicateur';

export interface MetadataParametrageIndicateurRepository {
  recupererListeMetadataParametrageIndicateurEnFonctionDesFiltres(chantierIds: string[], perimetreIds: string[], estTerritorialise: boolean, estBarometre: boolean): Promise<MetadataParametrageIndicateur[]>;

  recupererMetadataParametrageIndicateurParIndicId(indicId: string): Promise<MetadataParametrageIndicateur>;

  modifier(inputs: MetadataParametrageIndicateur): Promise<MetadataParametrageIndicateur>;

  importerEnMasseLesMetadataIndicateurs(listeMetadataIndicateur: ImportMetadataIndicateur[]): Promise<void>
  
  creer(inputs: MetadataParametrageIndicateur): Promise<MetadataParametrageIndicateur>;
}
