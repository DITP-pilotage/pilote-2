import { RapportContrat } from '@/server/app/contrats/RapportContrat';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { InformationIndicateurContrat } from '@/server/app/contrats/InformationIndicateurContrat';
import { ChantierInformations } from './ChantierInformation.interface';

export interface PageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[];
  rapport: RapportContrat | null
  informationsIndicateur: InformationIndicateurContrat[],
}
