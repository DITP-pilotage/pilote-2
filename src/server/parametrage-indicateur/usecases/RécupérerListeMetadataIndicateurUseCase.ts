import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export default class RécupérerListeMetadataIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository,
  ) {}

  async run(chantierIds: string[], perimetreIds: string[], estTerritorialise: boolean, estBarometre: boolean): Promise<MetadataParametrageIndicateur[]> {
    return this.metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurEnFonctionDesFiltres(chantierIds, perimetreIds, estTerritorialise, estBarometre);
  }
}
