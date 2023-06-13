import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[]
  territoireProjetStructurant?: ProjetStructurant['territoire']
  estDisponibleALImport?: boolean
  estInteractif?: boolean
}
