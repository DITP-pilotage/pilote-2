import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { ChantierInformations } from './ChantierInformation.interface';

export interface PageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs | null
}
