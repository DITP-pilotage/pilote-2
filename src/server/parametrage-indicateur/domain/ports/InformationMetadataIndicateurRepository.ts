import { InformationMetadataIndicateur } from '@/server/parametrage-indicateur/domain/InformationMetadataIndicateur';

export interface InformationMetadataIndicateurRepository {
  récupererInformationMetadataIndicateur(): Promise<InformationMetadataIndicateur[]>;
}
