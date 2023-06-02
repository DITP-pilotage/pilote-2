import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';
import { RapportContrat } from '@/server/app/contrats/RapportContrat';
import { ChantierInformations } from './ChantierInformation.interface';

export interface PageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[];
  rapport: RapportContrat | null
}
