import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { ChantierSynthétisé } from '@/server/chantiers/domain/Chantier.interface';
import {
  InformationDerniereModificationMetadataIndicateurContrat,
} from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';

export default interface FicheIndicateurProps {
  indicateur: MetadataParametrageIndicateurContrat
  informationHistorisationIndicateur: InformationDerniereModificationMetadataIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
  chantiers: ChantierSynthétisé[]
}
