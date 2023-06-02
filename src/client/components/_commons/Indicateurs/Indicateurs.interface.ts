import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[]
  estDisponibleALImport?: boolean
  estInteractif?: boolean
}
