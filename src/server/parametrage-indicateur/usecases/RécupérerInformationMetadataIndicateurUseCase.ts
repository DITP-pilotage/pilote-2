import { InformationMetadataIndicateur } from '@/server/parametrage-indicateur/domain/InformationMetadataIndicateur';
import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';

export default class RécupérerInformationMetadataIndicateurUseCase {
  constructor(
    private readonly informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository,
  ) {}
    
  run(): InformationMetadataIndicateur[] {
    return this.informationMetadataIndicateurRepository.récupererInformationMetadataIndicateur();
  }
}
