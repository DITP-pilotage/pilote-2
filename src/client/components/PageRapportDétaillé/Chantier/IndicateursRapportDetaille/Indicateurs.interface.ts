import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { CategoriesIndicateur, ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface RubriquesIndicateursProps {
  détailsIndicateurs: DétailsIndicateurs
  indicateurs: Indicateur[],
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[],
  territoireCode?: string
  typeDeRéforme: TypeDeRéforme
  categoriesIndicateurRepartition: Record<CategoriesIndicateur, Indicateur[]>
  sousIndicateursDisponibles: boolean
}
