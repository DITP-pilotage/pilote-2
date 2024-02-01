import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export default class RécupérerListeMetadataIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository,
  ) {}

  async run(chantierIds: string[]): Promise<MetadataParametrageIndicateur[]> {
    return this.metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurParChantierIds(chantierIds);
  }
}
