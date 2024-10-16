import { InformationMetadataIndicateur } from '@/server/parametrage-indicateur/domain/InformationMetadataIndicateur';
import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';

type Dependencies = {
  informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository,
};

export default class RécupérerInformationMetadataIndicateurUseCase {
  private informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository;

  constructor({
    informationMetadataIndicateurRepository,
  }: Dependencies) {
    this.informationMetadataIndicateurRepository = informationMetadataIndicateurRepository;
  }
    
  run(): InformationMetadataIndicateur[] {
    return this.informationMetadataIndicateurRepository.récupererInformationMetadataIndicateur();
  }
}
