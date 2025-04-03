import { CategoriesIndicateur, ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/chantiers/domain/DétailsIndicateur';
import Indicateur from '@/server/chantiers/domain/Indicateur';

export default interface RubriquesIndicateursProps {
  détailsIndicateurs: DétailsIndicateurs
  indicateurs: Indicateur[],
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[],
  territoireCode?: string
  typeDeRéforme: 'chantier'
  categoriesIndicateurRepartition: Record<CategoriesIndicateur, Indicateur[]>
  sousIndicateursDisponibles: boolean
}
