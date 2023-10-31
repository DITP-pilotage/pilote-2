import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default interface PageIndicateurProps {
  indicateur: MetadataParametrageIndicateurContrat,
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
  estUneCréation: boolean
  chantiers: ChantierSynthétisé[]
}
