import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

type Dependencies = {

  metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository,

};
export default class RécupérerUnIndicateurUseCase {
  private metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  constructor({
    metadataParametrageIndicateurRepository,
  }: Dependencies) {
    this.metadataParametrageIndicateurRepository = metadataParametrageIndicateurRepository;
  }

  async run(indicId: string): Promise<MetadataParametrageIndicateur> {
    return this.metadataParametrageIndicateurRepository.recupererMetadataParametrageIndicateurParIndicId(indicId);
  }
}
