import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { ChantierInformation } from './ChantierInformation.interface';

export interface PageImportIndicateurProps {
  chantierInformation: ChantierInformation
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs | null
}
