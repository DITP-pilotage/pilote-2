import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export default class RécupérerUnIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository,
  ) {}

  async run(indicId: string): Promise<MetadataParametrageIndicateur> {
    return this.metadataParametrageIndicateurRepository.recupererMetadataParametrageIndicateurParIndicId(indicId);
  }
}
