import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';
import { RapportContrat } from '@/server/app/contrats/RapportContrat';

export interface PageImportIndicateurSectionImportProps {
  indicateurs: Indicateur[]
  rapport: RapportContrat | null
}
