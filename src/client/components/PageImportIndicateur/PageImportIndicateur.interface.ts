import { DétailsIndicateurs } from '@/server/domain/chantier/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';
import { ChantierInformations } from './ChantierInformation.interface';

export interface PageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs | null
}
