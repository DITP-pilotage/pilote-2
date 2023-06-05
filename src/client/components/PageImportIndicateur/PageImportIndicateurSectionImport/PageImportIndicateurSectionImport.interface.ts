import { DétailsIndicateurs } from '@/server/domain/chantier/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';

export interface PageImportIndicateurSectionImportProps {
  détailsIndicateurs: DétailsIndicateurs | null
  indicateurs: Indicateur[]
}
