import { RapportContrat } from '@/server/app/contrats/RapportContrat';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { InformationIndicateurContrat } from '@/server/app/contrats/InformationIndicateurContrat';

export interface PageImportIndicateurSectionImportProps {
  indicateurs: Indicateur[]
  rapport: RapportContrat | null
  informationsIndicateur: InformationIndicateurContrat[],
}
