import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

type Depeendencies = {
  metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository,
};
export default class RécupérerListeMetadataIndicateurUseCase {
  private metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  constructor({
    metadataParametrageIndicateurRepository,
  }: Depeendencies) {
    this.metadataParametrageIndicateurRepository = metadataParametrageIndicateurRepository;
  }

  async run(chantierIds: string[], perimetreIds: string[], estTerritorialise: boolean, estBarometre: boolean): Promise<MetadataParametrageIndicateur[]> {
    return this.metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurEnFonctionDesFiltres(chantierIds, perimetreIds, estTerritorialise, estBarometre);
  }
}
