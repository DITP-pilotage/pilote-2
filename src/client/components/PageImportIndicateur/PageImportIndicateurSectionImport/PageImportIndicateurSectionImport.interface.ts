import { RapportContrat } from '@/server/app/contrats/RapportContrat';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export interface PageImportIndicateurSectionImportProps {
  indicateurs: Indicateur[]
  rapport: RapportContrat | null
}
