import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';
export default class ModifierUneMetadataIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository = dependencies.getMetadataParametrageIndicateurRepository(),
  ) {}

  async run(inputs: MetadataParametrageIndicateurForm) {
    return this.metadataParametrageIndicateurRepository.modifier(inputs);
  }
}
