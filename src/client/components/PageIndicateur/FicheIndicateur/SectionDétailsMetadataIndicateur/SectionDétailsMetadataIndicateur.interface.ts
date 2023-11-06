import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default interface SectionDétailsMetadataIndicateurProps {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
  chantiers: ChantierSynthétisé[]
}
