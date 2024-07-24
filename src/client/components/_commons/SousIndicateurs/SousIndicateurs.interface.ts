import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface SousIndicateursProps {
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  chantierEstTerritorialisé: boolean
  estInteractif: boolean
}
