import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export interface PageImportIndicateurSectionImportProps {
  détailsIndicateurs: DétailsIndicateurs | null
  indicateurs: Indicateur[]
}
